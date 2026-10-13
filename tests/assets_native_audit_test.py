"""Known-mask regressions for both compiler region-ID formats and logical scale."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('audit_native', ROOT / 'tools/asset-pipeline/audit_native.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
np, cv2 = audit.np, audit.cv2


class AssetDistanceTests(unittest.TestCase):
    def fixture(self, generated):
        scale = 1 if generated else 2
        template = {'id': 'known-regions', 'width': 160, 'height': 200, 'approved': True,
                    'regions': [{'id': 'r01', 'name': '長方形'}, {'id': 'r07', 'name': '小長方形'}]}
        rgb = [(73, 151, 199), (146, 46, 142)] if generated else [(1, 0, 0), (2, 0, 0)]
        image = np.zeros((200 // scale, 160 // scale, 3), np.uint8)
        image[40 // scale:100 // scale, 20 // scale:68 // scale] = rgb[0][::-1]
        image[130 // scale:170 // scale, 100 // scale:128 // scale] = rgb[1][::-1]
        image[0, 0] = (1, 1, 1)  # An antialiased color is not a region ID.
        png = cv2.imencode('.png', image)[1].tobytes()
        metadata = {'schemaVersion': 1, 'templateId': template['id'], 'templateHash': audit.template_hash(template),
                    'pngSha256': audit.digest(png), 'encoding': 'palette-rgb8' if generated else 'native-red8',
                    'rasterSize': [160 // scale, 200 // scale], 'logicalSize': [160, 200],
                    'palette': [{'id': r['id'], 'rgb': list(color)} for r, color in zip(template['regions'], rgb)]}
        return template, png, metadata

    def test_native_red_half_resolution_has_known_ids_areas_and_diameters(self):
        self.check_known_mask(False)

    def test_generated_rgb_full_resolution_has_same_logical_areas_and_diameters(self):
        self.check_known_mask(True)

    def check_known_mask(self, generated):
        template, png, metadata = self.fixture(generated)
        labels, scale = audit.decode_regions(png, metadata, template)
        self.assertEqual(labels[50 // int(scale), 30 // int(scale)], 1)
        self.assertEqual(labels[140 // int(scale), 110 // int(scale)], 2)
        self.assertEqual(labels[0, 0], 0)
        result = audit.audit_mask(template, png, metadata)
        self.assertTrue(result['pass'], result['errors'])
        self.assertEqual([r['id'] for r in result['regions']], ['r01', 'r07'])
        self.assertEqual([r['visibleArea'] for r in result['regions']], [2880, 1120])
        self.assertEqual([r['maxInscribedDiameter'] for r in result['regions']], [48, 28])
        self.assertEqual([r['visibleComponents'] for r in result['regions']], [1, 1])

    def test_stale_png_template_or_dimensions_fail_closed(self):
        for key, value in [('pngSha256', '0' * 64), ('templateHash', '0' * 64), ('rasterSize', [80, 100])]:
            with self.subTest(key=key):
                template, png, metadata = self.fixture(True)
                metadata[key] = value
                with self.assertRaises(ValueError):
                    audit.audit_mask(template, png, metadata)

    def test_missing_or_ambiguous_palette_never_mislabels_regions(self):
        template, png, metadata = self.fixture(True)
        metadata['palette'][1]['rgb'] = metadata['palette'][0]['rgb']
        with self.assertRaisesRegex(ValueError, 'unique'):
            audit.audit_mask(template, png, metadata)
        metadata.pop('palette')
        with self.assertRaisesRegex(ValueError, 'palette order'):
            audit.audit_mask(template, png, metadata)

    def test_no_width_exception_can_waive_a_sub_17px_current_mask(self):
        template, png, metadata = self.fixture(True)
        template['width'], template['height'] = 80, 100
        metadata['logicalSize'] = [80, 100]
        metadata['templateHash'] = audit.template_hash(template)
        result = audit.audit_mask(template, png, metadata, {'r07': {'reason': 'test-only'}})
        self.assertFalse(result['pass'])
        self.assertEqual(result['regions'][1]['maxInscribedDiameter'], 14)
        self.assertFalse(result['regions'][1]['widthExceptionApplied'])

    def test_reviewed_boundary_is_bound_to_its_exact_mask_and_operation_snapshot(self):
        ident = 'gen-tree-friends-v4'
        directory = ROOT / 'tools/asset-pipeline/output' / ident
        template = json.loads((ROOT / 'content/templates' / f'{ident}.json').read_text(encoding='utf-8'))
        metadata = json.loads((directory / 'analysis-region-ids.json').read_text(encoding='utf-8'))
        review = ROOT / 'content/generated-lineart/runtime-distance-review.json'
        exceptions = audit.verified_runtime_exceptions(template, metadata, review)
        self.assertEqual(list(exceptions), ['r28'])
        self.assertTrue(exceptions['r28']['allowBelowSelectionGuide'])
        self.assertAlmostEqual(exceptions['r28']['runtimeExactDiameter'], 16.970562)
        self.assertGreaterEqual(exceptions['r28']['sourceMaskDiameter'], 17)
        metadata['pngSha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'exact mask'):
            audit.verified_runtime_exceptions(template, metadata, review)

    def test_individual_measurement_exception_never_applies_after_width_changes(self):
        template, png, metadata = self.fixture(True)
        template['width'], template['height'] = 80, 100
        metadata['logicalSize'] = [80, 100]
        metadata['templateHash'] = audit.template_hash(template)
        exception = {'runtimeExactDiameter': 16.97, 'allowBelowSelectionGuide': True}
        result = audit.audit_mask(template, png, metadata, {'r07': exception})
        self.assertFalse(result['pass'])
        self.assertTrue(any('reviewed measurement' in error for error in result['errors']))
        self.assertFalse(result['regions'][1]['widthExceptionApplied'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
