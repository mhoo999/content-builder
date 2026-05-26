# Content Builder - Project Guidelines

## Project Overview

We are building a **template-agnostic LMS content builder** that supports round-trip editing of diverse template formats without corruption or forced normalization.

## Core Architecture Principles

### 1. Template Agnosticism

The editor **must not** be tightly coupled to any single template structure. Each template format should be treated as a first-class citizen with its own:

- Schema definition
- Layout rules
- Metadata format
- Export serialization

### 2. Round-Trip Compatibility Guarantee

**Critical Requirement:** If a template is imported, edited, and exported, it must maintain its original format:

- Template A → Import → Edit → Export → Template A (identical structure)
- Template B → Import → Edit → Export → Template B (identical structure)
- No forced conversion to a universal export format
- Preserve all original metadata, styling, and structural conventions

### 3. Separation of Concerns

The system must maintain clear boundaries between:

```
┌─────────────────────────────────────────────────┐
│ Common Editable Content Model (Internal)        │
│ - Neutral editing layer                         │
│ - Format-independent operations                 │
└─────────────────────────────────────────────────┘
           ↕                            ↕
┌──────────────────────┐    ┌──────────────────────┐
│ Template Parser      │    │ Template Renderer    │
│ - Import logic       │    │ - Display logic      │
│ - Schema detection   │    │ - Preview generation │
└──────────────────────┘    └──────────────────────┘
                  ↕
         ┌──────────────────────┐
         │ Template Exporter    │
         │ - Serialization      │
         │ - Format rules       │
         └──────────────────────┘
```

### 4. Component Responsibilities

#### Template Parser
- Detects template format/version
- Converts external format → internal content model
- Preserves original metadata for export
- Handles legacy format compatibility

#### Content Model (Neutral Layer)
- Format-independent representation
- Supports common operations (add/remove/reorder slides)
- Maintains reference to original template type
- Does NOT enforce any specific export structure

#### Template Renderer
- Converts internal model → visual representation
- Applies template-specific styling
- Generates preview without modifying data

#### Template Exporter
- Converts internal model → original external format
- Applies template-specific serialization rules
- Restores original metadata, spacing, structure
- Ensures byte-level compatibility where possible

## Development Guidelines

### DO ✓

- Keep parsers and exporters in separate, testable modules
- Store original template metadata alongside content
- Add new template support by extending parsers/exporters, not modifying core
- Test round-trip compatibility: `import(file) |> edit |> export === original_structure`
- Preserve unknown/extra fields from original templates

### DON'T ✗

- Hard-code template assumptions in the editor UI
- Convert all templates to a single "standard" export format
- Lose original metadata during import
- Couple rendering logic with export logic
- Assume all templates have the same field structure

## Code Organization

```
src/
├── models/
│   ├── contentModel.js          # Neutral internal representation
│   └── templatePresets.js       # Template metadata/themes
├── parsers/
│   ├── templateParser.js        # Detects and routes to specific parsers
│   ├── legacy2018Parser.js      # Format-specific import logic
│   └── modernParser.js
├── exporters/
│   ├── templateExporter.js      # Routes to specific exporters
│   ├── legacy2018Exporter.js    # Format-specific export logic
│   └── modernExporter.js
└── utils/
    ├── folderParser.js          # File handling
    └── validators.js            # Format validation
```

## Testing Requirements

For each supported template format, verify:

1. **Import fidelity**: All fields, metadata, and structure preserved
2. **Edit operations**: Add/remove/reorder content works correctly
3. **Export accuracy**: Output matches original format exactly
4. **Round-trip test**: `SHA256(original) === SHA256(import → edit → export)`

## Template Support Strategy

When adding a new template format:

1. Create dedicated parser in `parsers/[format]Parser.js`
2. Create dedicated exporter in `exporters/[format]Exporter.js`
3. Add format detection logic to `templateParser.js`
4. Register in `templatePresets.js` if UI selection needed
5. Add round-trip tests
6. Document format-specific quirks

## Current Known Formats

- **Legacy 2018**: Requires exact spacing, custom JSON serialization, specific theme detection
- **Modern**: (Define characteristics as implemented)

## Migration Path

When supporting older formats:

- Never break existing imports
- Add versioning to internal model if needed
- Maintain backward compatibility in exporters
- Document breaking changes in CHANGELOG

---

**Key Takeaway**: The builder is a neutral editing layer. Templates maintain sovereignty over their own serialization. Round-trip compatibility is the primary success metric.
