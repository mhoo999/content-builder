import { useState, useEffect, useCallback, useRef } from "react"
import { createCourseData, createBuilderLessonData, createProfessorData } from "./models/dataModel"
import ProfessorSection from "./components/Professor/ProfessorSection"
import PreparationSection from "./components/Preparation/PreparationSection"
import LearningSection from "./components/Learning/LearningSection"
import SummarySection from "./components/Summary/SummarySectionNew"
import StartModal from "./components/StartModal/StartModal"
import TemplateModal from "./components/TemplateModal/TemplateModal"
import SaveStatusIndicator from "./components/SaveStatusIndicator"
import StepBar from "./components/StepBar/StepBar"
import {
  convertDataJsonToBuilderFormat,
  parseSubjectsJson,
  parseProfessorInfo,
  markRelativeImages,
} from "./utils/folderParser"
import { TEMPLATE_PRESETS, detectTemplatePreset, detectTemplateTheme, getAllTemplates, getTemplateById } from "./models/templatePresets"
import { validateCourseData, logValidationResult, formatValidationMessage } from "./utils/dataValidator"
import "./App.css"

const STORAGE_KEY = "content-builder-autosave"

function App() {
  // localStorage 지원 여부 확인
  const isLocalStorageAvailable = () => {
    try {
      const test = "__localStorage_test__"
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  // localStorage에서 초기 데이터 로드
  const loadSavedData = () => {
    if (!isLocalStorageAvailable()) {
      console.warn("localStorage를 사용할 수 없습니다. (시크릿 모드일 수 있습니다)")
      return {
        courseCode: "",
        courseName: "",
        courseType: "general",
        year: "",
        backgroundImage: "",
        templatePreset: "2025-standard",
        templateTheme: "type-1",
        professor: createProfessorData(),
        lessons: [],
      }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 유효성 검사
        if (parsed && typeof parsed === "object") {
          // importedImages 복원 (별도 처리 필요)
          if (parsed.importedImages && Object.keys(parsed.importedImages).length > 0) {
            // importedImages는 별도 state이므로 여기서 직접 설정할 수 없음
            // useEffect에서 처리하도록 임시 저장
            window.__restoredImportedImages = parsed.importedImages
          }
          // importedSubtitles 복원 (별도 처리 필요)
          if (parsed.importedSubtitles && Object.keys(parsed.importedSubtitles).length > 0) {
            window.__restoredImportedSubtitles = parsed.importedSubtitles
          }
          // examWeeks 복원 (별도 처리 필요)
          if (parsed.examWeeks && Array.isArray(parsed.examWeeks) && parsed.examWeeks.length > 0) {
            window.__restoredExamWeeks = parsed.examWeeks
          }

          return {
            courseCode: parsed.courseCode || "",
            courseName: parsed.courseName || "",
            courseType: parsed.courseType || "general",
            year: parsed.year || "",
            backgroundImage: parsed.backgroundImage || "",
            templatePreset: parsed.templatePreset || "2025-standard",
            templateTheme: parsed.templateTheme || "type-1",
            professor: parsed.professor || createProfessorData(),
            lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
          }
        }
      }
    } catch (error) {
      console.warn("저장된 데이터를 불러오는 중 오류 발생:", error)
    }
    return {
      courseCode: "",
      courseName: "",
      courseType: "general",
      year: "",
      backgroundImage: "",
      templatePreset: "2025-standard",
      templateTheme: "type-1",
      professor: createProfessorData(),
      lessons: [],
    }
  }

  // 전역 과목 데이터
  const [courseData, setCourseData] = useState(loadSavedData)

  // 저장 상태
  const [saveStatus, setSaveStatus] = useState("저장됨")
  const saveTimeoutRef = useRef(null)
  const isInitialLoad = useRef(true)

  // 페이지 로드 시 저장된 데이터 복원 확인
  useEffect(() => {
    if (isInitialLoad.current && isLocalStorageAvailable()) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed && (parsed.lessons?.length > 0 || parsed.courseCode)) {
            // 저장된 데이터가 있으면 사용자에게 알림
            const restored = confirm(
              `저장된 작업 내용을 찾았습니다.\n\n` +
                `과목: ${parsed.courseName || parsed.courseCode || "없음"}\n` +
                `차시 수: ${parsed.lessons?.length || 0}개\n\n` +
                `불러오시겠습니까?`,
            )
            if (!restored) {
              // 불러오지 않으면 localStorage 초기화
              localStorage.removeItem(STORAGE_KEY)
              setCourseData({
                courseCode: "",
                courseName: "",
                year: "",
                backgroundImage: "",
                templatePreset: "2025-standard",
                templateTheme: "type-1",
                professor: createProfessorData(),
                lessons: [],
              })
              // importedImages, importedSubtitles, examWeeks도 초기화
              setImportedImages({})
              setImportedSubtitles({})
              setExamWeeks([])
              delete window.__restoredImportedImages
              delete window.__restoredImportedSubtitles
              delete window.__restoredExamWeeks
            } else {
              // 불러오기를 선택한 경우 importedImages, importedSubtitles, examWeeks 복원
              if (window.__restoredImportedImages) {
                setImportedImages(window.__restoredImportedImages)
                delete window.__restoredImportedImages
                console.log("Restored importedImages from localStorage")
              }
              if (window.__restoredImportedSubtitles) {
                setImportedSubtitles(window.__restoredImportedSubtitles)
                delete window.__restoredImportedSubtitles
                console.log("Restored importedSubtitles from localStorage")
              }
              if (window.__restoredExamWeeks) {
                setExamWeeks(window.__restoredExamWeeks)
                delete window.__restoredExamWeeks
                console.log("Restored examWeeks from localStorage")
              }
            }
          }
        } catch (error) {
          console.warn("저장된 데이터 파싱 오류:", error)
        }
      }
      isInitialLoad.current = false
    }
  }, [])

  // 임포트된 이미지 저장소 (경로 -> base64)
  const [importedImages, setImportedImages] = useState({})

  // 임포트된 자막 저장소 (파일명 -> 내용)
  const [importedSubtitles, setImportedSubtitles] = useState({})

  // 시험 주차 (중간고사/기말고사 등, lists가 없는 주차)
  const [examWeeks, setExamWeeks] = useState([])

  // 현재 편집 중인 차시
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)

  // 왼쪽 사이드바 접기/펼치기
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  // 오른쪽 사이드바 접기/펼치기
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  // 오른쪽 사이드바 탭 (info: 과목정보/교수정보, toc: 목차)
  const [rightSidebarTab, setRightSidebarTab] = useState("info")

  // 시작하기 모달
  const [showStartModal, setShowStartModal] = useState(false)
  // 템플릿 모달
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // 자동 저장 함수 (debounce 적용)
  const autoSave = useCallback((data, images, subtitles, exams) => {
    // localStorage 사용 불가능한 경우
    if (!isLocalStorageAvailable()) {
      setSaveStatus("저장 불가 (시크릿 모드)")
      return
    }

    // 이전 타이머 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaveStatus("저장 중...")

    // 3초 후 저장 (debounce) - 성능 최적화
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const dataToSave = { ...data, importedImages: images || {}, importedSubtitles: subtitles || {}, examWeeks: exams || [] }
        const dataStr = JSON.stringify(dataToSave)
        const dataSize = new Blob([dataStr]).size

        // localStorage 용량 제한 확인 (약 5MB)
        if (dataSize > 5 * 1024 * 1024) {
          setSaveStatus("저장 실패 (용량 초과)")
          console.warn("데이터가 너무 큽니다:", (dataSize / 1024 / 1024).toFixed(2), "MB")
          return
        }

        localStorage.setItem(STORAGE_KEY, dataStr)
        setSaveStatus("저장됨")
      } catch (error) {
        console.error("자동 저장 실패:", error)
        if (error.name === "QuotaExceededError") {
          setSaveStatus("저장 실패 (용량 초과)")
        } else {
          setSaveStatus("저장 실패")
        }
      }
    }, 3000)
  }, [])

  // courseData 또는 importedImages/importedSubtitles 변경 시 자동 저장
  useEffect(() => {
    // 초기 로드 시에는 저장하지 않음
    if (courseData.lessons.length > 0 || courseData.courseCode) {
      autoSave(courseData, importedImages, importedSubtitles, examWeeks)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [courseData, importedImages, importedSubtitles, examWeeks, autoSave])

  // 페이지 언로드 시 즉시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const dataToSave = { ...courseData, importedImages, importedSubtitles, examWeeks }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      } catch (error) {
        console.error("페이지 종료 시 저장 실패:", error)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [courseData, importedImages, importedSubtitles])

  // 초기화 함수 (로고 클릭 시)
  const resetToHome = () => {
    if (window.confirm("작업 내용이 저장되어 있습니다. 정말 처음으로 돌아가시겠습니까?")) {
      // localStorage는 유지하고 화면만 초기화
      setCourseData({
        courseCode: "",
        courseName: "",
        year: "",
        backgroundImage: "",
        templatePreset: "2025-standard",
        templateTheme: "type-1",
        professor: createProfessorData(),
        lessons: [],
      })
      setCurrentLessonIndex(0)
      setShowStartModal(true)
      setSaveStatus("저장됨")
    }
  }

  // 수동 검증 함수
  const runValidation = () => {
    if (courseData.lessons.length === 0) {
      alert("검증할 차시가 없습니다. 먼저 차시를 추가하거나 불러와주세요.");
      return;
    }

    const validationResult = validateCourseData(courseData);
    logValidationResult(validationResult);

    const message = formatValidationMessage(validationResult);
    alert(message);
  }

  // 새 차시 추가
  const addLesson = () => {
    const newLesson = createBuilderLessonData()
    let weekNumber = Math.ceil((courseData.lessons.length + 1) / 2)
    // 7주 이후는 8주를 건너뛰고 9주부터 시작
    if (weekNumber >= 8) {
      weekNumber += 1
    }
    newLesson.weekNumber = weekNumber
    newLesson.lessonNumber = courseData.lessons.length + 1

    // sectionInWeek 계산 (같은 주차의 몇 번째 차시인지)
    const sameWeekLessons = courseData.lessons.filter((l) => l.weekNumber === weekNumber)
    newLesson.sectionInWeek = sameWeekLessons.length + 1

    // 이전 차시의 다운로드 URL 복사
    if (courseData.lessons.length > 0) {
      const previousLesson = courseData.lessons[courseData.lessons.length - 1]
      if (previousLesson.instructionUrl) {
        newLesson.instructionUrl = previousLesson.instructionUrl
      }
      if (previousLesson.guideUrl) {
        newLesson.guideUrl = previousLesson.guideUrl
      }
    }

    setCourseData((prev) => ({
      ...prev,
      lessons: [...prev.lessons, newLesson],
    }))
    setCurrentLessonIndex(courseData.lessons.length)
  }

  // 차시 삭제
  const deleteLesson = (index) => {
    if (window.confirm("정말 이 차시를 삭제하시겠습니까?")) {
      setCourseData((prev) => ({
        ...prev,
        lessons: prev.lessons.filter((_, i) => i !== index),
      }))
      if (currentLessonIndex >= index && currentLessonIndex > 0) {
        setCurrentLessonIndex(currentLessonIndex - 1)
      }
    }
  }

  // 차시 데이터 업데이트
  const updateLesson = useCallback((index, updatedLesson) => {
    setCourseData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === index ? updatedLesson : lesson)),
    }))
  }, [])

  // 섹션 클릭 시 스크롤 핸들러
  const handleSectionClick = useCallback((sectionId) => {
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // 차시 번호 업데이트 (인라인 편집용)
  const updateLessonNumber = (index, lessonNumber) => {
    const lessonNum = parseInt(lessonNumber) || 1
    const lesson = courseData.lessons[index]
    updateLesson(index, { ...lesson, lessonNumber: lessonNum })
  }

  // 주차 번호 업데이트 (인라인 편집용)
  const updateLessonWeek = (index, weekNumber) => {
    const weekNum = parseInt(weekNumber) || 1
    const lesson = courseData.lessons[index]
    updateLesson(index, { ...lesson, weekNumber: weekNum })
  }

  // 해당 주차의 차시 순서 계산
  const getLessonOrderInWeek = (lessonIndex) => {
    const lesson = courseData.lessons[lessonIndex]
    const sameWeekLessons = courseData.lessons
      .filter((l) => l.weekNumber === lesson.weekNumber)
      .sort((a, b) => a.lessonNumber - b.lessonNumber)
    return sameWeekLessons.findIndex((l) => l.lessonNumber === lesson.lessonNumber) + 1
  }

  // 차시 제목 업데이트 (인라인 편집용)
  const updateLessonTitle = (index, title) => {
    const lesson = courseData.lessons[index]
    updateLesson(index, { ...lesson, lessonTitle: title })
  }

  // 주차 타이틀 업데이트 (같은 주차의 모든 차시에 동기화)
  const updateWeekTitle = (index, weekTitle) => {
    const currentLesson = courseData.lessons[index]
    const weekNumber = currentLesson.weekNumber

    // 같은 주차의 모든 차시 업데이트
    setCourseData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson) =>
        lesson.weekNumber === weekNumber
          ? { ...lesson, weekTitle: weekTitle }
          : lesson
      ),
    }))
  }

  // 현장실습 이미지 업데이트 (같은 주차의 모든 현장실습 차시에 동기화)
  const updatePracticeImage = (index, practiceImage) => {
    const currentLesson = courseData.lessons[index]
    const weekNumber = currentLesson.weekNumber

    // 같은 주차의 모든 현장실습 차시 업데이트
    setCourseData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson) =>
        lesson.weekNumber === weekNumber && lesson.isPracticeWeek
          ? { ...lesson, practiceImage: practiceImage }
          : lesson
      ),
    }))
  }

  // 모달에서 차시 생성
  const createLessonsFromModal = (lessonStructure, courseCode, courseName, year, courseType) => {
    // 주차별 차시 카운터
    const weekSectionCounter = {}

    const newLessons = lessonStructure.map((structure, index) => {
      const newLesson = createBuilderLessonData()
      newLesson.weekNumber = structure.weekNumber
      newLesson.lessonNumber = structure.lessonNumber || (index + 1)
      newLesson.lessonTitle = structure.title

      // sectionInWeek 계산 (같은 주차의 몇 번째 차시인지)
      const weekNum = newLesson.weekNumber
      if (!weekSectionCounter[weekNum]) {
        weekSectionCounter[weekNum] = 0
      }
      weekSectionCounter[weekNum]++
      newLesson.sectionInWeek = weekSectionCounter[weekNum]

      // 차시 번호를 2자리 문자열로 변환 (01, 02, ...)
      const lessonNumStr = String(newLesson.lessonNumber).padStart(2, "0")

      // 1강 1주차 1차시인 경우 오리엔테이션 자동 활성화 및 URL 자동 생성
      if (newLesson.weekNumber === 1 && newLesson.lessonNumber === 1) {
        newLesson.hasOrientation = true
        // 오리엔테이션 URL 자동 생성: https://cdn-it.livestudy.com/mov/{연도}/{코드명}/{코드명}_ot.mp4
        newLesson.orientation.videoUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_ot.mp4`
        newLesson.orientation.subtitlePath = `../subtitles/${courseCode}_ot.vtt`
      }

      // 강의 영상 URL 및 자막 파일 경로 자동 생성
      if (courseCode && year) {
        newLesson.lectureVideoUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/${courseCode}_${lessonNumStr}.mp4`
        newLesson.lectureSubtitle = `../subtitles/${courseCode}_${lessonNumStr}.vtt`
        newLesson.instructionUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_mp3_${lessonNumStr}.zip`
        newLesson.guideUrl = `https://cdn-it.livestudy.com/mov/${year}/${courseCode}/down/${courseCode}_book_${lessonNumStr}.zip`
      }

      return newLesson
    })

    setCourseData((prev) => ({
      ...prev,
      courseCode: courseCode || prev.courseCode,
      courseName: courseName || prev.courseName,
      year: year || prev.year,
      courseType: courseType || prev.courseType || 'general',
      lessons: newLessons,
    }))
    setCurrentLessonIndex(0)
  }

  // 과목 정보 업데이트
  const updateCourseInfo = (field, value) => {
    setCourseData((prev) => ({ ...prev, [field]: value }))
  }

  // 교수 정보 업데이트
  const updateProfessor = (field, value) => {
    setCourseData((prev) => ({
      ...prev,
      professor: { ...prev.professor, [field]: value },
    }))
  }

  // Export to Subjects Folder
  const exportToSubjects = async () => {
    if (!courseData.courseCode) {
      alert("과목 코드를 입력해주세요.")
      return
    }

    if (courseData.lessons.length === 0) {
      alert("차시를 추가해주세요.")
      return
    }

    // 데이터 검증
    const validationResult = validateCourseData(courseData);
    logValidationResult(validationResult);

    if (validationResult.hasIssues) {
      const proceed = window.confirm(
        `⚠️ ${validationResult.issues.length}개의 미입력 필드가 발견되었습니다.\n\n그래도 Export를 진행하시겠습니까?\n\n💡 콘솔(F12)에서 상세 내용을 확인할 수 있습니다.`
      );
      if (!proceed) {
        return;
      }
    }

    // 출력 경로 입력 받기
    // Windows/macOS/Linux 공통 경로 안내
    const isWindows = navigator.platform.toLowerCase().includes("win")
    const defaultPath = isWindows ? "~/Documents" : "~/Documents"
    const examplePath = isWindows
      ? "C:\\Users\\username\\Documents\n또는: ~/Documents (자동 확장됨)"
      : "~/Documents\n또는: /Users/username/Documents"

    const outputPath = prompt(`출력 경로를 입력하세요:\n\n예: ${examplePath}`, defaultPath)

    if (!outputPath) {
      return // 사용자가 취소
    }

    // Export 전 모든 차시의 sectionInWeek 재계산
    // (차시 번호나 주차를 수정했을 때 sectionInWeek가 자동 업데이트되지 않으므로)
    const dataWithRecalculatedSections = {
      ...courseData,
      lessons: courseData.lessons.map((lesson, index) => ({
        ...lesson,
        sectionInWeek: getLessonOrderInWeek(index),
      })),
    }

    // 수식만 이미지로 변환 (표는 HTML로 유지)
    console.log("수식을 이미지로 변환하는 중... (표는 HTML 유지)")
    const { convertAllMathAndTablesInData } = await import("./utils/convertToImages")
    const convertedData = await convertAllMathAndTablesInData(dataWithRecalculatedSections, { convertTables: false })
    console.log("변환 완료, export 데이터 확인:", convertedData)

    // 익스포트할 데이터 준비
    // importedImages는 이미 base64로 변환되어 있음 (export 시 원본 이미지 복사용)
    // importedSubtitles는 자막 파일 내용 (export 시 복사용)
    // examWeeks는 시험 주차 (중간고사/기말고사 등, lists가 없는 주차)
    const exportData = {
      ...convertedData,
      importedImages: importedImages, // export 시 원본 이미지 복사용
      importedSubtitles: importedSubtitles, // export 시 자막 파일 복사용
      examWeeks: examWeeks, // 시험 주차 (중간고사/기말고사 등)
    }

    try {
      // API 호출하여 폴더 구조 생성
      const response = await fetch("/api/export-subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseData: exportData,
          outputPath: outputPath,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "폴더 생성 중 오류가 발생했습니다.")
      }

      const result = await response.json()
      alert(`✅ 폴더 구조 생성 완료!\n\n` + `위치: ${result.outputPath}\n` + `차시 수: ${result.lessonCount}개`)
    } catch (error) {
      console.error("Export error:", error)

      // API가 없는 경우 대체 방법 안내
      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const filename = `${courseData.courseCode}_builder.json`
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)

      const pythonCmd = isWindows ? "python" : "python3"
      const command = `${pythonCmd} builder_to_subjects.py ${filename} ${outputPath}`
      alert(
        `⚠️ API 서버가 실행되지 않았습니다.\n\n` +
          `JSON 파일이 다운로드되었습니다.\n` +
          `Python 스크립트가 HTML의 base64 이미지를 자동으로 파일로 저장하고 상대경로로 교체합니다.\n\n` +
          `터미널에서 다음 명령어를 실행하세요:\n\n${command}`,
      )
    }
  }

  // Folder Import (subjects/{code}/ 폴더 구조)
  const importFolder = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    try {
      // 모든 data.json 파일 찾기 (차시 번호 파악용)
      const dataJsonFiles = files.filter((f) => f.webkitRelativePath.endsWith("/assets/data/data.json"))

      if (dataJsonFiles.length === 0) {
        alert("data.json 파일을 찾을 수 없습니다.")
        return
      }

      // 차시 번호 추출 (최소값 파악)
      const lessonNumbers = dataJsonFiles.map((file) => {
        const pathParts = file.webkitRelativePath.split("/")
        const lessonFolder = pathParts[pathParts.length - 4] // subjects/{code}/{lesson}/assets/data/data.json
        return parseInt(lessonFolder, 10)
      })

      const minLessonNumber = Math.min(...lessonNumbers)

      // index.html 파일을 하나 찾아서 템플릿 판별용으로 사용
      const indexHtmlFiles = files.filter((f) => f.webkitRelativePath.endsWith("index.html"))
      let sampleHtmlContent = ""
      if (indexHtmlFiles.length > 0) {
        sampleHtmlContent = await indexHtmlFiles[0].text()
      }

      // subjects.json 찾기
      const subjectsJsonFile = files.find((f) => f.webkitRelativePath.endsWith("subjects.json"))
      let lessonTitles = {}
      let weekTitles = {}
      let examWeeks = [] // 시험 주차 (중간고사/기말고사 등)

      if (subjectsJsonFile) {
        const subjectsText = await subjectsJsonFile.text()
        const subjectsData = JSON.parse(subjectsText)
        // 시작 차시 번호 전달
        const parsed = parseSubjectsJson(subjectsData, minLessonNumber)
        lessonTitles = parsed.lessonTitles
        weekTitles = parsed.weekTitles
        examWeeks = parsed.examWeeks || []
      }

      // 이미지 파일들 찾기 (base64 변환하지 않음, 원본과 동일하게 상대경로만 유지)
      const imageFiles = files.filter((f) => {
        const path = f.webkitRelativePath.toLowerCase()
        return (
          path.includes("/images/") &&
          (path.endsWith(".jpg") ||
            path.endsWith(".jpeg") ||
            path.endsWith(".png") ||
            path.endsWith(".gif") ||
            path.endsWith(".webp"))
        )
      })

      // 이미지 파일을 base64로 변환하여 저장 (표시용 + export 시 원본 복사용)
      const imageStore = {}
      await Promise.all(
        imageFiles.map(async (file) => {
          const pathParts = file.webkitRelativePath.split("/")
          const imagesIndex = pathParts.findIndex((p) => p === "images")
          if (imagesIndex !== -1) {
            const relativePath = "../" + pathParts.slice(imagesIndex).join("/")
            // File 객체를 base64로 변환 (표시용)
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target.result)
              reader.readAsDataURL(file)
            })
            imageStore[relativePath] = base64
          }
        }),
      )

      // 이미지 저장소 업데이트 (base64로 변환된 데이터 저장)
      setImportedImages(imageStore)
      console.log(`Imported ${Object.keys(imageStore).length} images`)

      // 자막 파일들 찾기 (.vtt 파일)
      const subtitleFiles = files.filter((f) => {
        const path = f.webkitRelativePath.toLowerCase()
        return path.includes("/subtitles/") && path.endsWith(".vtt")
      })

      // 자막 파일 읽어서 저장
      const subtitleStore = {}
      await Promise.all(
        subtitleFiles.map(async (file) => {
          const pathParts = file.webkitRelativePath.split("/")
          const filename = pathParts[pathParts.length - 1]
          const content = await file.text()
          subtitleStore[filename] = content
        }),
      )

      // 자막 저장소 업데이트
      setImportedSubtitles(subtitleStore)
      console.log(`Imported ${Object.keys(subtitleStore).length} subtitles`)

      // 시험 주차 저장 (중간고사/기말고사 등)
      setExamWeeks(examWeeks)
      if (examWeeks.length > 0) {
        console.log(`Imported ${examWeeks.length} exam weeks:`, examWeeks.map((w) => `${w.weekNumber}주 ${w.weekTitle}`).join(", "))
      }

      // 차시 번호 추출 및 정렬 (이미 위에서 dataJsonFiles를 찾았음)
      const lessonData = await Promise.all(
        dataJsonFiles.map(async (file) => {
          const pathParts = file.webkitRelativePath.split("/")
          const lessonFolder = pathParts[pathParts.length - 4] // subjects/{code}/{lesson}/assets/data/data.json
          const lessonNumber = parseInt(lessonFolder, 10)

          const text = await file.text()
          const dataJson = JSON.parse(text)

          return { lessonNumber, dataJson, file }
        }),
      )

      // 차시 번호로 정렬
      lessonData.sort((a, b) => a.lessonNumber - b.lessonNumber)

      // 교수 정보 추출 (교수 정보가 있는 첫 번째 일반 차시에서)
      let professorInfo = createProfessorData()
      const firstNormalLesson = lessonData.find(item => item.dataJson.pages && item.dataJson.pages.length > 0)
      if (firstNormalLesson) {
        professorInfo = parseProfessorInfo(firstNormalLesson.dataJson)
      }

      // 교수 사진도 임시 base64로 변환 (표시용)
      if (professorInfo.photo && imageStore[professorInfo.photo]) {
        professorInfo.photo = imageStore[professorInfo.photo]
      }

      // Builder 형식으로 변환 + 상대경로 이미지 마킹 및 임시 base64 변환 (표시용)
      // Use new parser system with sampleHtmlContent for template detection
      const lessons = lessonData.map((item, index) => {
        const builderLesson = convertDataJsonToBuilderFormat(
          item.dataJson,
          item.lessonNumber,
          sampleHtmlContent, // Use sample HTML for template detection
          imageStore // Pass imported images
        )
        builderLesson.lessonTitle = lessonTitles[item.lessonNumber] || `${item.lessonNumber}차시`
        builderLesson.weekTitle = weekTitles[builderLesson.weekNumber] || ""

        // Note: Image marking is now handled by the new parser system
        // Legacy code below is kept for backward compatibility
        if (!sampleHtmlContent) {
          // If no HTML content, use legacy parser which requires manual image marking
          // 이미지가 포함된 필드들에 data-original-src 속성 추가 및 임시 base64 변환
          // 용어 내용
          if (builderLesson.terms) {
            builderLesson.terms = builderLesson.terms.map((term) => ({
              ...term,
              content: markRelativeImages(term.content, imageStore),
            }))
          }
          // 교수님 의견
          if (builderLesson.professorThink) {
            builderLesson.professorThink = markRelativeImages(builderLesson.professorThink, imageStore)
          }
          // 연습문제 (문항, 해설, 선택지)
          if (builderLesson.exercises) {
            builderLesson.exercises = builderLesson.exercises.map((ex) => ({
              ...ex,
              question: markRelativeImages(ex.question, imageStore),
              commentary: markRelativeImages(ex.commentary, imageStore),
              options: ex.options ? ex.options.map((opt) => markRelativeImages(opt, imageStore)) : [],
            }))
          }
          // 학습정리
          if (builderLesson.summary) {
            builderLesson.summary = builderLesson.summary.map((s) => markRelativeImages(s, imageStore))
          }
        }

        return builderLesson
      })

      // 과목 코드 추출 (파일 경로에서)
      // 경로 예시: "25itinse/01/assets/data/data.json" 또는 "subjects/25itinse/01/assets/data/data.json"
      // 차시 폴더(01, 02...)의 바로 상위 폴더가 과목코드
      let courseCode = ""
      if (dataJsonFiles.length > 0) {
        const pathParts = dataJsonFiles[0].webkitRelativePath.split("/")
        // pathParts 끝에서부터: data.json(-1), data(-2), assets(-3), 차시폴더(-4), 과목코드(-5)
        // 예: ['25itinse', '01', 'assets', 'data', 'data.json']
        //      [0]         [1]   [2]       [3]     [4]
        // length=5, 과목코드 인덱스 = 5-5 = 0 ✓
        // 예: ['subjects', '25itinse', '01', 'assets', 'data', 'data.json']
        //      [0]         [1]         [2]   [3]       [4]     [5]
        // length=6, 과목코드 인덱스 = 6-5 = 1 ✓
        const courseCodeIndex = pathParts.length - 5
        if (courseCodeIndex >= 0) {
          courseCode = pathParts[courseCodeIndex]
        }

        // 추출된 코드가 숫자로만 되어 있으면 (차시 폴더를 잘못 선택한 경우) 상위 폴더 확인
        if (/^\d+$/.test(courseCode) && courseCodeIndex > 0) {
          courseCode = pathParts[courseCodeIndex - 1] || courseCode
        }
      }

      // 과정명 추출 (첫 번째 data.json의 subject 필드에서)
      let courseName = ""
      if (lessonData.length > 0 && lessonData[0].dataJson.subject) {
        courseName = lessonData[0].dataJson.subject
      }

      // 과정 유형 추론 (용어체크 페이지가 없으면 사회복지현장실습)
      let courseType = "general"
      if (lessonData.length > 0) {
        const firstDataJson = lessonData[0].dataJson
        const hasTermPage = firstDataJson.pages?.some(page => page.component === "term")
        if (!hasTermPage) {
          courseType = "social-work-practice"
        }
      }

      // 템플릿 프리셋 감지
      const detectedPreset = detectTemplatePreset(
        lessonData.length > 0 ? lessonData[0].dataJson : null, 
        sampleHtmlContent
      )

      // 감지된 프리셋의 테마 설정
      let presetTheme = detectTemplateTheme(detectedPreset, sampleHtmlContent);

      // 임포트 데이터 검증
      const tempCourseData = {
        courseCode: courseCode,
        courseName: courseName,
        courseType: courseType,
        year: "",
        backgroundImage: "",
        templatePreset: detectedPreset,
        templateTheme: presetTheme,
        professor: professorInfo,
        lessons: lessons,
      };

      // 데이터 설정
      setCourseData(tempCourseData);
      setCurrentLessonIndex(0);

      // 데이터 검증
      const validationResult = validateCourseData(tempCourseData);
      logValidationResult(validationResult);

      // 성공 메시지 표시
      const imageCount = Object.keys(imageStore).length;
      const courseTypeLabel = courseType === "social-work-practice" ? "사회복지현장실습" : "일반";
      let successMessage = `${lessons.length}개 차시를 성공적으로 불러왔습니다!\n\n과목코드: ${courseCode}\n과정명: ${courseName}\n과정 유형: ${courseTypeLabel}\n이미지: ${imageCount}개 저장됨`;

      if (validationResult.hasIssues) {
        successMessage += `\n\n⚠️ ${validationResult.issues.length}개의 미입력 필드가 발견되었습니다.\n💡 콘솔(F12)에서 상세 내용을 확인하세요.`;
      } else {
        successMessage += '\n\n✅ 모든 필수 필드가 입력되었습니다.';
      }

      alert(successMessage);
    } catch (error) {
      console.error("Folder import error:", error)
      alert("폴더를 불러오는 중 오류가 발생했습니다: " + error.message)
    }
  }

  const currentLesson = courseData.lessons[currentLessonIndex]
  const currentPreset = getTemplateById(courseData.templatePreset) || getTemplateById("2025-standard")

  return (
    <div className="app">
      {/* 시작하기 모달 */}
      {showStartModal && <StartModal onClose={() => setShowStartModal(false)} onCreate={createLessonsFromModal} />}

      {/* 템플릿 선택 모달 */}
      {showTemplateModal && (
        <TemplateModal 
          onClose={() => setShowTemplateModal(false)}
          activePreset={courseData.templatePreset || "2025-standard"}
          activeTheme={courseData.templateTheme || "type-1"}
          onApply={(preset, theme) => {
            setCourseData(prev => ({
              ...prev,
              templatePreset: preset,
              templateTheme: theme
            }))
          }}
        />
      )}

      {/* 헤더 */}
      <header className="header">
        <button
          className="header-toggle-btn header-toggle-left"
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          title={leftSidebarOpen ? "차시 목록 닫기" : "차시 목록 열기"}
        >
          {leftSidebarOpen ? "◀" : "▶"}
        </button>
        <div className="header-left">
          <h1 className="logo-clickable" onClick={resetToHome} title="처음으로 돌아가기">
            📚 Content Builder
          </h1>
          <SaveStatusIndicator saveStatus={saveStatus} />
          {!isLocalStorageAvailable() && (
            <span
              className="storage-warning"
              title="시크릿 모드에서는 자동 저장이 작동하지 않습니다. 수동으로 Export하여 백업하세요."
            >
              ⚠️ 저장 불가
            </span>
          )}
        </div>
        <div className="header-actions">
          <label className="btn-secondary">
            📂 Import Folder
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={importFolder}
              style={{ display: "none" }}
            />
          </label>
          <button
            className="btn-secondary"
            onClick={runValidation}
            disabled={courseData.lessons.length === 0}
            title="현재 데이터 검증 (누락 필드, 형식 오류 등)"
          >
            🔍 검증
          </button>
          <button
            className="btn-primary"
            onClick={exportToSubjects}
            disabled={courseData.lessons.length === 0 || !courseData.courseCode}
            title="JSON 다운로드 + 폴더 구조 생성 안내"
          >
            📁 Export to Subjects
          </button>
        </div>
        <button
          className="header-toggle-btn header-toggle-right"
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          title={rightSidebarOpen ? "과목 정보 닫기" : "과목 정보 열기"}
        >
          {rightSidebarOpen ? "▶" : "◀"}
        </button>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="main-content">
        {/* 왼쪽 사이드바 (차시 목록만) */}
        <aside className={`sidebar sidebar-left ${leftSidebarOpen ? "open" : "collapsed"}`}>
          <div className="lessons-list">
            <div className="lessons-header">
              <h3>차시 목록</h3>
              <button className="btn-add" onClick={addLesson} disabled={courseData.lessons.length === 0}>
                + 새 차시
              </button>
            </div>

            {courseData.lessons.length === 0 ? (
              <p className="empty-message">차시를 추가해주세요</p>
            ) : (
              <div className="lesson-tabs">
                {courseData.lessons.map((lesson, index) => (
                  <div
                    key={index}
                    className={`lesson-tab ${currentLessonIndex === index ? "active" : ""}`}
                    onClick={() => setCurrentLessonIndex(index)}
                  >
                    <div className="lesson-info">
                      {/* 1줄: 1강 [✓실습] [✓현장실습] */}
                      <div className="lesson-number-row">
                        <span className="lesson-number">{lesson.lessonNumber}강</span>
                        {courseData.courseType === 'general' && (
                          <label className="practice-checkbox-inline">
                            <input
                              type="checkbox"
                              checked={lesson.hasPractice || false}
                              onChange={(e) => {
                                e.stopPropagation()
                                const hasPractice = e.target.checked
                                const lectureVideoUrl = lesson.lectureVideoUrl || ""
                                const lectureSubtitle = lesson.lectureSubtitle || ""

                                // 학습내용에서 실습 항목 제거 (기존 데이터 마이그레이션)
                                const learningContents = lesson.learningContents
                                  ? lesson.learningContents.filter(
                                      (content) => !(typeof content === "string" && content.includes("class='practice'")),
                                    )
                                  : []

                                // 실습 내용 초기화 (기존 practiceContent가 없으면 기본값 설정)
                                const practiceContent =
                                  hasPractice && !lesson.practiceContent
                                    ? "<div class='practice'><ul><li></li></ul></div>"
                                    : lesson.practiceContent || ""

                                updateLesson(index, {
                                  ...lesson,
                                  hasPractice: hasPractice,
                                  practiceContent: hasPractice ? practiceContent : "",
                                  practiceVideoUrl:
                                    hasPractice && lectureVideoUrl ? lectureVideoUrl.replace(".mp4", "_P.mp4") : "",
                                  practiceSubtitle:
                                    hasPractice && lectureSubtitle ? lectureSubtitle.replace(".vtt", "_P.vtt") : "",
                                  learningContents: learningContents, // 실습 항목 제거된 학습내용
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span>실습</span>
                          </label>
                        )}
                        {courseData.courseType === 'social-work-practice' && (
                          <label className="practice-checkbox-inline">
                            <input
                              type="checkbox"
                              checked={lesson.isPracticeWeek || false}
                              onChange={(e) => {
                                e.stopPropagation()
                                updateLesson(index, {
                                  ...lesson,
                                  isPracticeWeek: e.target.checked,
                                  practiceImage: e.target.checked ? (lesson.practiceImage || "") : "",
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span>현장실습</span>
                          </label>
                        )}
                      </div>

                      {/* 2줄: 1주 주차타이틀 */}
                      <div className="week-title-row">
                        <span className="week-label">{lesson.weekNumber}주</span>
                        <input
                          type="text"
                          className="week-title-input"
                          placeholder="주차 타이틀 입력"
                          value={lesson.weekTitle || ""}
                          onChange={(e) => updateWeekTitle(index, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* 3줄: 1차 차시제목 */}
                      <div className="lesson-title-row">
                        <span className="lesson-order-label">{getLessonOrderInWeek(index)}차</span>
                        <input
                          type="text"
                          className="lesson-title-input"
                          placeholder="차시 제목 입력"
                          value={lesson.lessonTitle}
                          onChange={(e) => updateLessonTitle(index, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteLesson(index)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 에디터 영역 */}
        <main className="editor-area-wrapper">
          {currentLesson && <StepBar lessonData={currentLesson} onSectionClick={handleSectionClick} courseType={courseData.courseType} />}
          <div className="editor-area">
            {courseData.lessons.length === 0 ? (
              <div className="welcome-screen">
                <h2>Content Builder에 오신 것을 환영합니다! 👋</h2>
                <p>차시 구조를 먼저 만들어 시작하세요.</p>
                <button className="btn-start-center" onClick={() => setShowStartModal(true)}>
                  시작하기
                </button>
              </div>
            ) : currentLesson ? (
              <div className="lesson-editor">
                <h2>
                  {(() => {
                    // 같은 주차에 속한 차시들 중에서 현재 차시가 몇 번째인지 계산
                    const sameWeekLessons = courseData.lessons
                      .filter((lesson) => lesson.weekNumber === currentLesson.weekNumber)
                      .sort((a, b) => a.lessonNumber - b.lessonNumber)
                    const weekLessonNumber =
                      sameWeekLessons.findIndex((lesson) => lesson.lessonNumber === currentLesson.lessonNumber) + 1
                    return `${currentLesson.lessonNumber}강 ${currentLesson.weekNumber}주차 ${weekLessonNumber}차시`
                  })()}
                </h2>
                <p className="subtitle">{currentLesson.lessonTitle || "제목 없음"}</p>

                {/* 현장실습 주차 */}
                {currentLesson.isPracticeWeek ? (
                  <div className="form-section">
                    <h3>📸 현장실습 이미지</h3>
                    <div className="subsection">
                      <div className="form-group">
                        <label>이미지 URL</label>
                        <input
                          type="url"
                          placeholder="https://it.livestudy.com/files/images/202507/sabok_preparing.png"
                          value={currentLesson.practiceImage || ""}
                          onChange={(e) => updatePracticeImage(currentLessonIndex, e.target.value)}
                        />
                        <small className="hint">현장실습 주차에 표시될 이미지 URL을 입력하세요 (같은 주차 전체에 적용됨)</small>
                      </div>
                      {currentLesson.practiceImage && (
                        <div className="image-preview">
                          <img src={currentLesson.practiceImage} alt="현장실습 이미지 미리보기" style={{ maxWidth: '100%', marginTop: '10px' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 준비하기 섹션 */}
                    {currentPreset.sections.includes("준비하기") && (
                      <div id="section-preparation">
                        <PreparationSection
                          lessonData={currentLesson}
                          onUpdate={(updated) => updateLesson(currentLessonIndex, updated)}
                          courseCode={courseData.courseCode}
                          year={courseData.year}
                          courseType={courseData.courseType}
                        />
                      </div>
                    )}

                    {/* 학습하기 섹션 */}
                    {currentPreset.sections.includes("학습하기") && (
                      <div id="section-learning">
                        <LearningSection
                          lessonData={currentLesson}
                          onUpdate={(updated) => updateLesson(currentLessonIndex, updated)}
                          courseCode={courseData.courseCode}
                          year={courseData.year}
                        />
                      </div>
                    )}

                    {/* 정리하기 섹션 */}
                    {currentPreset.sections.includes("정리하기") && (
                      <div id="section-summary">
                        <SummarySection
                          lessonData={currentLesson}
                          onUpdate={(updated) => updateLesson(currentLessonIndex, updated)}
                          courseCode={courseData.courseCode}
                          year={courseData.year}
                          courseType={courseData.courseType}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </main>

        {/* 오른쪽 사이드바 (과목 정보, 교수 정보) */}
        <aside className={`sidebar sidebar-right ${rightSidebarOpen ? "open" : "collapsed"}`}>
          <div className="sidebar-toggle" onClick={() => setRightSidebarOpen(!rightSidebarOpen)}>
            {rightSidebarOpen ? "▶" : "◀"}
          </div>
          {rightSidebarOpen && (
            <div className="sidebar-content">
              {/* 탭 헤더 */}
              <div className="sidebar-tabs">
                <button
                  className={`sidebar-tab ${rightSidebarTab === "info" ? "active" : ""}`}
                  onClick={() => setRightSidebarTab("info")}
                >
                  정보
                </button>
                <button
                  className={`sidebar-tab ${rightSidebarTab === "toc" ? "active" : ""}`}
                  onClick={() => setRightSidebarTab("toc")}
                >
                  목차
                </button>
              </div>

              {/* 탭 내용 */}
              {rightSidebarTab === "info" && (
                <>
                  {/* 과목 정보 */}
                  <div className="sidebar-section">
                    <h3>과목 정보</h3>
                    <div className="form-group">
                      <label>과목 코드</label>
                      <div className="readonly-input">
                        {courseData.courseCode || <span className="empty-value">-</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>과정명</label>
                      <div className="readonly-input">
                        {courseData.courseName || <span className="empty-value">-</span>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>템플릿 프리셋 / 디자인</label>
                      <div className="template-select-box" onClick={() => setShowTemplateModal(true)}>
                        <div className="template-current-info">
                          <div className="template-current-name">
                            {getTemplateById(courseData.templatePreset || "2025-standard")?.name}
                          </div>
                          <div className="template-current-theme">
                            테마: {getTemplateById(courseData.templatePreset || "2025-standard")?.themes.find(t => t.id === (courseData.templateTheme || "type-1"))?.name || courseData.templateTheme || "type-1"}
                          </div>
                        </div>
                        <button className="btn-change-template" onClick={(e) => { e.stopPropagation(); setShowTemplateModal(true); }}>변경</button>
                      </div>
                      <small className="hint">Export 시 적용될 레이아웃 및 테마입니다.</small>
                    </div>
                  </div>

                  {/* 교수 정보 */}
                  <div className="sidebar-section">
                    <h3>교수 정보</h3>
                    <ProfessorSection
                      professor={courseData.professor}
                      onUpdate={(updated) => setCourseData((prev) => ({ ...prev, professor: updated }))}
                      disabled={courseData.lessons.length === 0}
                    />
                  </div>
                </>
              )}

              {rightSidebarTab === "toc" && courseData.lessons.length > 0 && currentLesson && (
                <div className="sidebar-section">
                  <h3>목차</h3>
                  <nav className="toc-nav">
                    {currentPreset.sections.includes("준비하기") && (
                      <a
                        href="#section-preparation"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("section-preparation")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-main"
                      >
                        📚 준비하기
                      </a>
                    )}
                    {currentPreset.features.hasOrientation && currentLesson.weekNumber === 1 && currentLesson.lessonNumber === 1 && (
                      <a
                        href="#subsection-orientation"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-orientation")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        오리엔테이션
                      </a>
                    )}
                    {currentPreset.features.hasTerm && courseData.courseType === 'general' && (
                      <a
                        href="#subsection-terms"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-terms")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        용어체크
                      </a>
                    )}
                    {currentPreset.features.hasObjectives && (
                      <a
                        href="#subsection-objectives"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-objectives")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        학습목표
                      </a>
                    )}
                    {currentPreset.sections.includes("준비하기") && (
                      <a
                        href="#subsection-contents"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-contents")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        학습내용
                      </a>
                    )}
                    {currentPreset.sections.includes("학습하기") && (
                      <a
                        href="#section-learning"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("section-learning")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-main"
                      >
                        🎓 학습하기
                      </a>
                    )}
                    {currentPreset.features.hasOpinion && (
                      <a
                        href="#subsection-opinion"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-opinion")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        생각묻기
                      </a>
                    )}
                    {currentPreset.features.hasLecture && (
                      <a
                        href="#subsection-lecture"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-lecture")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        강의보기
                      </a>
                    )}
                    {currentPreset.features.hasCheck && (
                      <a
                        href="#subsection-check"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-check")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        점검하기
                      </a>
                    )}
                    {currentPreset.sections.includes("정리하기") && (
                      <a
                        href="#section-summary"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("section-summary")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-main"
                      >
                        ✅ 정리하기
                      </a>
                    )}
                    {currentPreset.features.hasExercise && courseData.courseType === 'general' && (
                      <a
                        href="#subsection-exercises"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-exercises")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        연습문제
                      </a>
                    )}
                    {currentPreset.features.hasTheorem && (
                      <a
                        href="#subsection-summary"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-summary")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        학습정리
                      </a>
                    )}
                    {currentPreset.features.hasNext && (
                      <a
                        href="#subsection-next"
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById("subsection-next")
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "start" })
                          }
                        }}
                        className="toc-link toc-sub"
                      >
                        다음안내
                      </a>
                    )}
                  </nav>
                </div>
              )}

              {rightSidebarTab === "toc" && courseData.lessons.length === 0 && (
                <div className="sidebar-section">
                  <p className="empty-message">차시를 먼저 생성해주세요.</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default App
