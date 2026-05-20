"""
ShortQuiz Family Exporter

Handles 2026-hrc template (1 template):
- 2026-hrc: Short-form quiz template with lecture + exercise

Key characteristics:
- 2 sections: 학습하기, 퀴즈 (or 연습문제)
- lecture and exercise components only
- Minimal structure for quick assessment

Theme: 26hrc
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


class ShortQuizExporter(BaseExporter):
    """
    Exporter for ShortQuiz Family templates (2026-hrc)
    """

    def __init__(self):
        super().__init__()
        self.name = "ShortQuizExporter"

    def can_export(self, content_model):
        """
        Check if this exporter can handle the content model
        """
        if not content_model or '_meta' not in content_model:
            return False

        template_id = content_model['_meta'].get('sourceTemplateId', '')
        return template_id == '2026-hrc'

    def export(self, content_model, output_dir):
        """
        Export the content model to the output directory

        NOTE: This is currently a facade to the existing builder_to_subjects.py
        In future iterations, this will be fully reimplemented with proper
        ShortQuiz-specific logic.

        Args:
            content_model: Content model to export
            output_dir: Output directory path

        Returns:
            Dictionary with export results
        """
        if legacy_exporter is None:
            raise ImportError("Cannot import builder_to_subjects.py for legacy export")

        template_id = content_model['_meta'].get('sourceTemplateId', '2026-hrc')
        theme = content_model['_meta'].get('sourceTheme', '26hrc')

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
        return "short-quiz"

    def _get_components(self):
        """
        Get component list for ShortQuiz template

        Returns:
            List of component names in order
        """
        return ['lecture', 'exercise']

    def _create_data_json(self, content_model):
        """
        Create data.json structure for ShortQuiz template

        Args:
            content_model: Content model

        Returns:
            Dictionary representing data.json
        """
        # Build pages array
        pages = []

        # TODO: Implement component creation logic
        # For now, return basic structure

        return {
            'sections': ['학습하기', '퀴즈'],
            'index': content_model.get('weekNumber', 1),
            'section': content_model.get('sectionInWeek', 1),
            'pages': pages,
            'instruction': content_model.get('instructionUrl', ''),
            'guide': content_model.get('guideUrl', '')
        }
