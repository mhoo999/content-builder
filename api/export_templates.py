# export_templates.py
# 이 파일은 builder_to_subjects.py에서 사용하는 템플릿 프리셋 정의입니다.
#
# NOTE: This file is being transitioned to the new exporter system in exporters/
# For new code, use exporters.template_exporter instead.

TEMPLATE_PRESETS = {
    "2018-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2018/base.css">

	<link rel="stylesheet" href="../../../resources/scripts/videojs/video-js.min.css">

	<link rel="stylesheet" href="../../../resources/styles/2018/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2018/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/mediaquery.css">

	<link rel="stylesheet" href="../../../resources/styles/2018/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/templates/layout.js"></script>
	<script src="../../../resources/scripts/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
    },
    "2019-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2019/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2019/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2019/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2019/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2019/templates/layout.js"></script>
	<script src="../../../resources/scripts/2019/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2019/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "practice", "check", "exercise", "theorem", "next"]
    },
    "2020-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/scripts/videojs/video-js.min.css">

	<link rel="stylesheet" href="../../../resources/styles/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2020/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2019/templates/layout.js"></script>
	<script src="../../../resources/scripts/2019/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2019/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
    },
    "2021-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2021/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2021/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2021/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2021/templates/layout.js"></script>
	<script src="../../../resources/scripts/2021/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2021/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "practice", "check", "exercise", "theorem", "next"]
    },
    "2022-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2022/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2022/templates/layout.js"></script>
	<script src="../../../resources/scripts/2022/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2022/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
    },
    "2023-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2023/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2023/templates/layout.js"></script>
	<script src="../../../resources/scripts/2023/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2023/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
    },
    "2025-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2023/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2025/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2022/templates/layout.js"></script>
	<script src="../../../resources/scripts/2022/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2022/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
    },
    "2026-standard": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2023/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2025/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2023/templates/layout.js"></script>
	<script src="../../../resources/scripts/2023/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2023/commons.js"></script>""",
        "components": ["intro", "orientation", "term", "objectives", "opinion", "lecture", "check", "exercise", "theorem", "next"]
    },
    "2022-ct": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2022/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2022/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2022/templates/layout_ct.js"></script>
	<script src="../../../resources/scripts/2022/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2022/commons_ct.js"></script>""",
        "components": ["lecture"]
    },
    "onboard-dunamu": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/base-gr19.css">
	<link rel="stylesheet" href="../../../resources/styles/layout-dunamu21.css">
	<link rel="stylesheet" href="../../../resources/styles/modules-gr25.css">
	<link rel="stylesheet" href="../../../resources/styles/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/templates/layout-summary.js"></script>
	<script src="../../../resources/scripts/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/commons.js"></script>""",
        "components": ["lecture"]
    },
    "2024-hrd": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/2023/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2023/templates/layout.js"></script>
	<script src="../../../resources/scripts/2023/templates/defaults_hrd.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2024/commons_hrd.js"></script>""",
        "components": ["intro", "exercise_pre", "objectives", "lecture", "exercise_post", "theorem", "next"]
    },
    "2026-hrd": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/base-gr19.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/layout-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/modules-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2026/templates/layout-hrd.js"></script>
	<script src="../../../resources/scripts/2026/templates/defaults-hrd.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2026/commons.js"></script>""",
        "components": ["intro", "objectives", "exercise_pre", "lecture", "exercise_post", "theorem", "next"]
    },
    "2022-legal": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/base.css">
	<link rel="stylesheet" href="../../../resources/styles/layout-legal.css">
	<link rel="stylesheet" href="../../../resources/styles/modules-legal.css">
	<link rel="stylesheet" href="../../../resources/styles/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/templates/layout.js"></script>
	<script src="../../../resources/scripts/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/commons.js"></script>""",
        "components": ["intro", "orientation", "lecture", "practice", "exercise", "theorem"]
    },
    "2026-hrc": {
        "html_head": """	<link rel="stylesheet" href="../../../resources/styles/base-gr19.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/layout-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/modules-hrd.css">
	<link rel="stylesheet" href="../../../resources/styles/2026/{theme}.css">""",
        "html_head_scripts": """	<script src="../../../resources/scripts/2026/templates/layout-hrd.js"></script>
	<script src="../../../resources/scripts/2026/templates/defaults-hrd.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>""",
        "html_body_scripts": """	<script src="../../../resources/scripts/2026/commons.js"></script>""",
        "components": ["lecture", "exercise"]
    }
}
