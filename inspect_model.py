import joblib
import json
import numpy as np

m = joblib.load('ml/models/crop_price_model.joblib')
with open('tests/unit/tree_parity_fixtures.json', 'r', encoding='utf-8') as f:
    fixtures = json.load(f)

with open('ml/models/crop_price_trees.json', 'r', encoding='utf-8') as f:
    trees_json = json.load(f)

MODEL_FEATURE_NAMES = [
  'commodity_enc',
  'district_enc',
  'market_enc',
  'current_price',
  'min_price',
  'max_price',
  'spread',
  'roll_mean_7d',
  'roll_mean_30d',
  'roll_std_30d',
  'momentum_7d',
  'sin_month',
  'cos_month',
  'sin_doy',
  'cos_doy'
]

# Side 'left': if val <= th[mid]: high = mid else low = mid + 1
def search_sorted_left(arr, val):
    low = 0
    high = len(arr)
    while low < high:
        mid = (low + high) // 2
        if val <= arr[mid]:
            high = mid
        else:
            low = mid + 1
    return low

def py_js_traverse(h_name, feat_vec):
    h_model = trees_json[h_name]
    base_pred = h_model['base_prediction']
    bin_thresh = h_model['bin_thresholds']
    is_cat = h_model['is_categorical']
    trees = h_model['trees']
    feat_names = h_model['feature_names']

    name_to_idx = {name: i for i, name in enumerate(feat_names)}
    n_features = len(bin_thresh)

    binned = np.zeros(n_features, dtype=np.int32)
    for j in range(n_features):
        fname = MODEL_FEATURE_NAMES[j]
        raw_val = feat_vec[name_to_idx[fname]]

        if is_cat[j]:
            if raw_val is None or np.isnan(raw_val) or raw_val < 0:
                binned[j] = 255
            else:
                th_arr = bin_thresh[j]
                ival = int(raw_val)
                if ival < len(th_arr) and th_arr[ival] == raw_val:
                    binned[j] = ival
                else:
                    binned[j] = 255
                    for bi, th in enumerate(th_arr):
                        if th == raw_val:
                            binned[j] = bi
                            break
        else:
            if raw_val is None or np.isnan(raw_val):
                binned[j] = 255
            else:
                th_arr = bin_thresh[j]
                # Single-precision float matching float32 in sklearn
                v = float(np.float32(raw_val))
                binned[j] = search_sorted_left(th_arr, v)

    total = base_pred
    for t in trees:
        nodes = t['nodes']
        curr = 0
        while not nodes[curr]['is_leaf']:
            node = nodes[curr]
            f_idx = node['feature_idx']
            bin_val = binned[f_idx]
            miss_left = node.get('missing_go_to_left', True)
            is_c = node.get('is_categorical', False)

            go_left = False
            if bin_val == 255:
                go_left = miss_left
            elif is_c:
                bitset = node['bitset']
                w = np.uint32(bitset[bin_val >> 5])
                shift = int(bin_val & 31)
                go_left = bool((w >> shift) & 1)
            else:
                th = node['bin_threshold']
                go_left = bin_val <= th

            curr = node['left'] if go_left else node['right']
        total += nodes[curr]['value']

    return total

max_d = 0.0
fails = []
all_results = []
for h_name in ['7 Days', '15 Days', '30 Days']:
    for idx, f_item in enumerate(fixtures[h_name]):
        pred = py_js_traverse(h_name, f_item['feature_vector'])
        exp = f_item['expected_delta']
        diff = abs(pred - exp)
        if diff > max_d:
            max_d = diff
        all_results.append({
            'h': h_name,
            'idx': idx,
            'crop': f_item['crop'],
            'pred': pred,
            'exp': exp,
            'diff': diff
        })
        if diff > 1e-4:
            fails.append({
                'h': h_name,
                'idx': idx,
                'crop': f_item['crop'],
                'pred': pred,
                'exp': exp,
                'diff': diff
            })

with open('all_fixtures_left_test.json', 'w', encoding='utf-8') as f:
    json.dump({
        'max_diff': max_d,
        'fails_count': len(fails),
        'fails': fails
    }, f, indent=2)

print("LEFT_TEST_DONE")
