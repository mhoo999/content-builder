"""
Template Exporter Router

Auto-detects template format from content model and routes to appropriate exporter.
This is the main entry point for export operations.
"""

from .families.standard_exporter import StandardExporter
from .families.hrd_exporter import HrdExporter
from .families.legal_exporter import LegalExporter
from .families.short_exporter import ShortExporter
from .families.short_quiz_exporter import ShortQuizExporter

# Priority-based exporter list
EXPORTERS = [
    LegalExporter,  # 5-section unique structure (highest priority)
    ShortQuizExporter,  # 2-section: lecture + exercise
    ShortExporter,  # 1-section: lecture only
    HrdExporter,  # HRD components
    StandardExporter,  # Default fallback
]


def export_template(content_model, output_dir):
    """
    Export content model to output directory using appropriate exporter

    Args:
        content_model: Content model with _meta field
        output_dir: Output directory path

    Returns:
        Dictionary with export results

    Raises:
        ValueError: If no exporter found for template
    """
    if not content_model or '_meta' not in content_model:
        raise ValueError("Content model must have _meta field")

    template_id = content_model['_meta'].get('sourceTemplateId', 'unknown')

    # Find appropriate exporter
    for ExporterClass in EXPORTERS:
        exporter = ExporterClass()
        if exporter.can_export(content_model):
            print(f"Using {exporter.name} for template: {template_id}")
            return exporter.export(content_model, output_dir)

    # If no exporter found, raise error
    raise ValueError(f"No exporter found for template: {template_id}")


def detect_template_id(content_model):
    """
    Detect template ID from content model

    Args:
        content_model: Content model with _meta field

    Returns:
        Template ID string
    """
    if not content_model or '_meta' not in content_model:
        return "unknown"

    return content_model['_meta'].get('sourceTemplateId', 'unknown')
