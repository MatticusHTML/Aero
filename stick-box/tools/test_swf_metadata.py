"""Regression checks for authored stage colors in compressed and raw SWFs."""
import struct
import unittest
import zlib

from import_series import swf_metadata


def movie(tags, compressed=False):
    # Minimal RECT, 24fps, one frame; no content needs to execute for metadata.
    body = b"\x08\x00\x00\x18\x01\x00" + tags
    signature = b"CWS" if compressed else b"FWS"
    return signature + b"\x08" + struct.pack("<I", len(body) + 8) + (zlib.compress(body) if compressed else body)


def background(rgb):
    return struct.pack("<H", (9 << 6) | 3) + bytes(rgb) + b"\x00\x00"


class StageBackgroundTests(unittest.TestCase):
    def test_authored_light_dark_and_gray_colors(self):
        for compressed in (False, True):
            for rgb, expected in [((255, 255, 255), "#ffffff"), ((0, 0, 0), "#000000"), ((221, 221, 221), "#dddddd")]:
                with self.subTest(compressed=compressed, expected=expected):
                    self.assertEqual(swf_metadata(movie(background(rgb), compressed))["stageBackground"], expected)

    def test_missing_tag_does_not_invent_a_theme_color(self):
        self.assertIsNone(swf_metadata(movie(b"\x00\x00"))["stageBackground"])

    def test_skips_extended_length_tags_before_background(self):
        other_tag = struct.pack("<HI", (77 << 6) | 63, 70) + b"x" * 70
        self.assertEqual(swf_metadata(movie(other_tag + background((153, 153, 153))))["stageBackground"], "#999999")

    def test_rejects_truncated_background_tag(self):
        with self.assertRaisesRegex(ValueError, "Truncated SWF tag data"):
            swf_metadata(movie(struct.pack("<H", (9 << 6) | 3) + b"\xff"))


if __name__ == "__main__":
    unittest.main()
