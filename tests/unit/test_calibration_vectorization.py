#!/usr/bin/env python3
"""
Unit test verifying exact mathematical and logical equivalence between
the original row-by-row iterrows() evaluation and the optimized vectorized evaluation
in AgriME crop interval calibration.
"""

import unittest
import numpy as np
import pandas as pd


class TestCalibrationVectorization(unittest.TestCase):
    def setUp(self):
        # 1. Setup mock crop-level calibration (Tier 1)
        self.crop_calibration = {
            'tomato': {
                'tier': 'crop_specific',
                'val_samples': 23020,
                'group': 'Vegetables',
                'margin_90_inr': 3503.23,
                'margin_95_inr': 4052.05
            },
            'paddy (dhan)': {
                'tier': 'crop_specific',
                'val_samples': 6407,
                'group': 'Cereals & Millets',
                'margin_90_inr': 522.26,
                'margin_95_inr': 667.95
            },
            'turmeric': {
                'tier': 'crop_specific',
                'val_samples': 602,
                'group': 'Spices & Plantation',
                'margin_90_inr': 3375.21,
                'margin_95_inr': 4458.22
            }
        }

        # 2. Setup mock group-level calibration (Tier 2 fallback)
        self.group_calibration = {
            'Vegetables': {
                'val_samples': 705892,
                'margin_90_inr': 1567.23,
                'margin_95_inr': 2560.07
            },
            'Cereals & Millets': {
                'val_samples': 15825,
                'margin_90_inr': 461.03,
                'margin_95_inr': 608.95
            },
            'Spices & Plantation': {
                'val_samples': 41997,
                'margin_90_inr': 4909.47,
                'margin_95_inr': 7318.68
            }
        }

        # 3. Setup mock global quantiles (Tier 3 fallback)
        self.global_p90_margin = 1876.20
        self.global_p95_margin = 3219.24
        self.cur_margin = 428.16

        # 4. Construct synthetic test dataset spanning all 3 fallback tiers
        records = [
            # Tier 1 matches:
            {'commodity_clean': 'tomato', 'group': 'Vegetables', 'abs_err': 1200.0},
            {'commodity_clean': 'tomato', 'group': 'Vegetables', 'abs_err': 3800.0},
            {'commodity_clean': 'paddy (dhan)', 'group': 'Cereals & Millets', 'abs_err': 300.0},
            {'commodity_clean': 'paddy (dhan)', 'group': 'Cereals & Millets', 'abs_err': 600.0},
            {'commodity_clean': 'turmeric', 'group': 'Spices & Plantation', 'abs_err': 4000.0},
            # Tier 2 fallback matches (crop missing from crop_calibration, group present):
            {'commodity_clean': 'brinjal', 'group': 'Vegetables', 'abs_err': 1400.0},
            {'commodity_clean': 'brinjal', 'group': 'Vegetables', 'abs_err': 2000.0},
            {'commodity_clean': 'wheat', 'group': 'Cereals & Millets', 'abs_err': 500.0},
            # Tier 3 fallback matches (unknown commodity and unknown group):
            {'commodity_clean': 'unknown_alien_crop', 'group': 'Other / Unclassified', 'abs_err': 1500.0},
            {'commodity_clean': 'wild_herb', 'group': 'Unmapped_Group', 'abs_err': 3500.0}
        ]
        self.test_df = pd.DataFrame(records)

    def run_original_logic(self, test_df):
        covered_cur_global = np.sum(test_df['abs_err'] <= self.cur_margin)
        pct_cur_global = (covered_cur_global / len(test_df)) * 100.0

        covered_proposed_90 = 0
        covered_proposed_95 = 0
        proposed_margins_90 = []
        proposed_margins_95 = []

        for idx, row in test_df.iterrows():
            c_name = row['commodity_clean']
            grp = row['group']
            c_cal = self.crop_calibration.get(c_name)
            if c_cal:
                m90 = c_cal['margin_90_inr']
                m95 = c_cal['margin_95_inr']
            else:
                grp_cal = self.group_calibration.get(grp)
                if grp_cal:
                    m90 = grp_cal['margin_90_inr']
                    m95 = grp_cal['margin_95_inr']
                else:
                    m90 = self.global_p90_margin
                    m95 = self.global_p95_margin

            err = row['abs_err']
            if err <= m90:
                covered_proposed_90 += 1
            if err <= m95:
                covered_proposed_95 += 1
            proposed_margins_90.append(m90)
            proposed_margins_95.append(m95)

        cov_p90_pct = (covered_proposed_90 / len(test_df)) * 100.0
        cov_p95_pct = (covered_proposed_95 / len(test_df)) * 100.0
        mean_p90_margin = float(np.mean(proposed_margins_90))
        mean_p95_margin = float(np.mean(proposed_margins_95))

        group_eval = {}
        for grp, g_test in test_df.groupby('group'):
            n_g = len(g_test)
            cov_cur = np.sum(g_test['abs_err'] <= self.cur_margin)
            pct_cur = (cov_cur / n_g) * 100.0

            g_cov90 = 0
            g_cov95 = 0
            g_m90s = []
            for _, r in g_test.iterrows():
                c_name = r['commodity_clean']
                m90 = self.crop_calibration.get(c_name, {}).get(
                    'margin_90_inr',
                    self.group_calibration.get(grp, {}).get('margin_90_inr', self.global_p90_margin)
                )
                m95 = self.crop_calibration.get(c_name, {}).get(
                    'margin_95_inr',
                    self.group_calibration.get(grp, {}).get('margin_95_inr', self.global_p95_margin)
                )
                if r['abs_err'] <= m90:
                    g_cov90 += 1
                if r['abs_err'] <= m95:
                    g_cov95 += 1
                g_m90s.append(m90)

            group_eval[grp] = {
                'test_sample_count': int(n_g),
                'current_global_coverage_pct': round(pct_cur, 2),
                'proposed_90_coverage_pct': round((g_cov90 / n_g) * 100.0, 2),
                'proposed_95_coverage_pct': round((g_cov95 / n_g) * 100.0, 2),
                'current_margin_inr': self.cur_margin,
                'proposed_mean_90_margin_inr': round(float(np.mean(g_m90s)), 2),
                'test_mae_inr': round(float(g_test['abs_err'].mean()), 2)
            }

        return {
            'covered_90': covered_proposed_90,
            'covered_95': covered_proposed_95,
            'cov_p90_pct': cov_p90_pct,
            'cov_p95_pct': cov_p95_pct,
            'mean_m90': mean_p90_margin,
            'mean_m95': mean_p95_margin,
            'margins_90': proposed_margins_90,
            'margins_95': proposed_margins_95,
            'group_eval': group_eval
        }

    def run_vectorized_logic(self, test_df):
        df = test_df.copy()
        crop_m90 = {c: float(v['margin_90_inr']) for c, v in self.crop_calibration.items()}
        crop_m95 = {c: float(v['margin_95_inr']) for c, v in self.crop_calibration.items()}
        grp_m90 = {g: float(v['margin_90_inr']) for g, v in self.group_calibration.items()}
        grp_m95 = {g: float(v['margin_95_inr']) for g, v in self.group_calibration.items()}

        m90_tier1 = df['commodity_clean'].map(crop_m90)
        m90_tier2 = df['group'].map(grp_m90)
        df['proposed_m90'] = m90_tier1.fillna(m90_tier2).fillna(self.global_p90_margin).astype(np.float64)

        m95_tier1 = df['commodity_clean'].map(crop_m95)
        m95_tier2 = df['group'].map(grp_m95)
        df['proposed_m95'] = m95_tier1.fillna(m95_tier2).fillna(self.global_p95_margin).astype(np.float64)

        df['cov_cur'] = df['abs_err'] <= self.cur_margin
        df['cov_90'] = df['abs_err'] <= df['proposed_m90']
        df['cov_95'] = df['abs_err'] <= df['proposed_m95']

        covered_proposed_90 = int(df['cov_90'].sum())
        covered_proposed_95 = int(df['cov_95'].sum())
        cov_p90_pct = (covered_proposed_90 / len(df)) * 100.0
        cov_p95_pct = (covered_proposed_95 / len(df)) * 100.0
        mean_p90_margin = float(df['proposed_m90'].mean())
        mean_p95_margin = float(df['proposed_m95'].mean())

        group_eval = {}
        for grp, g_test in df.groupby('group'):
            n_g = len(g_test)
            g_cov_cur = int(g_test['cov_cur'].sum())
            g_cov90 = int(g_test['cov_90'].sum())
            g_cov95 = int(g_test['cov_95'].sum())

            group_eval[grp] = {
                'test_sample_count': int(n_g),
                'current_global_coverage_pct': round((g_cov_cur / n_g) * 100.0, 2),
                'proposed_90_coverage_pct': round((g_cov90 / n_g) * 100.0, 2),
                'proposed_95_coverage_pct': round((g_cov95 / n_g) * 100.0, 2),
                'current_margin_inr': self.cur_margin,
                'proposed_mean_90_margin_inr': round(float(g_test['proposed_m90'].mean()), 2),
                'test_mae_inr': round(float(g_test['abs_err'].mean()), 2)
            }

        return {
            'covered_90': covered_proposed_90,
            'covered_95': covered_proposed_95,
            'cov_p90_pct': cov_p90_pct,
            'cov_p95_pct': cov_p95_pct,
            'mean_m90': mean_p90_margin,
            'mean_m95': mean_p95_margin,
            'margins_90': list(df['proposed_m90'].values),
            'margins_95': list(df['proposed_m95'].values),
            'group_eval': group_eval
        }

    def test_vectorized_matches_original_exactly(self):
        orig = self.run_original_logic(self.test_df)
        vect = self.run_vectorized_logic(self.test_df)

        # 1. Total covered observation counts
        self.assertEqual(orig['covered_90'], vect['covered_90'])
        self.assertEqual(orig['covered_95'], vect['covered_95'])

        # 2. Coverage percentages
        self.assertAlmostEqual(orig['cov_p90_pct'], vect['cov_p90_pct'], places=9)
        self.assertAlmostEqual(orig['cov_p95_pct'], vect['cov_p95_pct'], places=9)

        # 3. Mean margin widths
        self.assertAlmostEqual(orig['mean_m90'], vect['mean_m90'], places=9)
        self.assertAlmostEqual(orig['mean_m95'], vect['mean_m95'], places=9)

        # 4. Item-by-item margins assigned
        np.testing.assert_allclose(orig['margins_90'], vect['margins_90'])
        np.testing.assert_allclose(orig['margins_95'], vect['margins_95'])

        # 5. Group evaluations
        self.assertEqual(orig['group_eval'].keys(), vect['group_eval'].keys())
        for grp in orig['group_eval']:
            self.assertEqual(orig['group_eval'][grp], vect['group_eval'][grp])


if __name__ == '__main__':
    unittest.main()
