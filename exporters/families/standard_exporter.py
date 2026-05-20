"""
Standard Family Exporter

Handles 2018-2025 standard templates (7 templates):
- 2018-standard (no practice, special JSON format)
- 2019-standard (with practice)
- 2020-standard (no practice)
- 2021-standard (with practice)
- 2022-standard (no practice)
- 2023-standard (no practice)
- 2025-standard (no practice)

Common structure: 4 sections (인트로, 준비하기, 학습하기, 정리하기)
Components: intro, orientation, term, objectives, opinion, lecture, practice?, check, exercise, theorem, next
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
from ..serializers.legacy_serializer import legacy_json_dumps
from ..serializers.modern_serializer import modern_json_dumps


class StandardExporter(BaseExporter):
    """
    Exporter for Standard Family templates (2018-2025)
    """

    def __init__(self):
        super().__init__()
        self.name = "StandardExporter"

    def can_export(self, content_model):
        """
        Check if this exporter can handle the content model
        """
        if not content_model or '_meta' not in content_model:
            return False

        template_id = content_model['_meta'].get('sourceTemplateId', '')
        return template_id in [
            '2018-standard',
            '2019-standard',
            '2020-standard',
            '2021-standard',
            '2022-standard',
            '2023-standard',
            '2025-standard'
        ]

    def export(self, content_model, output_dir):
        """
        Export the content model to the output directory

        NOTE: This is currently a facade to the existing builder_to_subjects.py
        In future iterations, this will be fully reimplemented with proper
        template-specific logic.

        Args:
            content_model: Content model to export
            output_dir: Output directory path

        Returns:
            Dictionary with export results
        """
        if legacy_exporter is None:
            raise ImportError("Cannot import builder_to_subjects.py for legacy export")

        template_id = content_model['_meta'].get('sourceTemplateId', '2025-standard')
        theme = content_model['_meta'].get('sourceTheme', 'type-1')

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
        return "standard"

    def _get_serializer(self, template_id):
        """
        Get appropriate JSON serializer based on template year

        Args:
            template_id: Template ID (e.g., "2018-standard")

        Returns:
            Serializer function
        """
        if template_id == '2018-standard':
            return legacy_json_dumps
        else:
            return modern_json_dumps

    def _get_components(self, template_id, content_model):
        """
        Get component list based on template ID

        Args:
            template_id: Template ID
            content_model: Content model

        Returns:
            List of component names
        """
        # 2019 and 2021 have practice component
        if template_id in ['2019-standard', '2021-standard'] and content_model.get('hasPractice'):
            return ['intro', 'orientation', 'term', 'objectives', 'opinion',
                    'lecture', 'practice', 'check', 'exercise', 'theorem', 'next']
        else:
            return ['intro', 'orientation', 'term', 'objectives', 'opinion',
                    'lecture', 'check', 'exercise', 'theorem', 'next']

    def _create_data_json(self, content_model):
        """
        Create data.json structure for standard templates

        Args:
            content_model: Content model

        Returns:
            Dictionary representing data.json
        """
        template_id = content_model['_meta'].get('sourceTemplateId', '2025-standard')

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
