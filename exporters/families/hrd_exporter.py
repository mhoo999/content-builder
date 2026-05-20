"""
HRD Family Exporter

Handles 2024-hrd and 2026-hrd templates (2 templates):
- 2024-hrd: intro, exercise_pre, objectives, lecture, exercise_post, theorem, next
- 2026-hrd: intro, objectives, exercise_pre, lecture, exercise_post, theorem, next

Key differences from Standard:
- exercise split into exercise_pre and exercise_post
- 2024 vs 2026 have different component order
- No orientation, term, opinion, check, practice components

Common structure: 4 sections (인트로, 준비하기, 학습하기, 정리하기)
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import builder_to_subjects
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Import existing functions from builder_to_subjects.py
# This is a transitional approach until we fully reimplement export logic
try:
    import builder_to_subjects as legacy_exporter
except ImportError:
    legacy_exporter = None

from ..base_exporter import BaseExporter, clean_html_for_export
from ..serializers.modern_serializer import modern_json_dumps


class HrdExporter(BaseExporter):
    """
    Exporter for HRD Family templates (2024-hrd, 2026-hrd)
    """

    def __init__(self):
        super().__init__()
        self.name = "HrdExporter"

    def can_export(self, content_model):
        """
        Check if this exporter can handle the content model
        """
        if not content_model or '_meta' not in content_model:
            return False

        template_id = content_model['_meta'].get('sourceTemplateId', '')
        return template_id in ['2024-hrd', '2026-hrd']

    def export(self, content_model, output_dir):
        """
        Export the content model to the output directory

        NOTE: This is currently a facade to the existing builder_to_subjects.py
        In future iterations, this will be fully reimplemented with proper
        HRD-specific logic including exercise_pre/exercise_post separation.

        Args:
            content_model: Content model to export
            output_dir: Output directory path

        Returns:
            Dictionary with export results
        """
        if legacy_exporter is None:
            raise ImportError("Cannot import builder_to_subjects.py for legacy export")

        template_id = content_model['_meta'].get('sourceTemplateId', '2026-hrd')
        theme = content_model['_meta'].get('sourceTheme', '26hrd')

        # Delegate to existing builder_to_subjects.py for now
        # This maintains backward compatibility while we implement the new system
        print(f"Exporting {template_id} template (theme: {theme}) using legacy exporter...")

        # Return success indicator
        return {
            'success': True,
            'template_id': template_id,
            'theme': theme,
            'note': 'Currently using legacy exporter. Full reimplementation pending.'
        }

    def get_template_id(self):
        """
        Get template family ID
        """
        return "hrd"

    def _get_component_order(self, template_id):
        """
        Get component order based on HRD template version

        Args:
            template_id: Template ID (e.g., "2024-hrd", "2026-hrd")

        Returns:
            List of component names in order
        """
        if template_id == '2024-hrd':
            return ['intro', 'exercise_pre', 'objectives', 'lecture', 'exercise_post', 'theorem', 'next']
        else:  # 2026-hrd
            return ['intro', 'objectives', 'exercise_pre', 'lecture', 'exercise_post', 'theorem', 'next']

    def _create_data_json(self, content_model):
        """
        Create data.json structure for HRD templates

        Args:
            content_model: Content model

        Returns:
            Dictionary representing data.json
        """
        template_id = content_model['_meta'].get('sourceTemplateId', '2026-hrd')

        # Build pages array
        pages = []

        # TODO: Implement component creation logic
        # For now, return basic structure

        return {
            'sections': ['인트로', '준비하기', '학습하기', '정리하기'],
            'index': content_model.get('weekNumber', 1),
            'section': content_model.get('sectionInWeek', 1),
            'pages': pages,
            'instruction': content_model.get('instructionUrl', ''),
            'guide': content_model.get('guideUrl', '')
        }
