import { useState, useEffect } from 'react';
import './Home.css';

function Home({ onNewProject, onLoadProject, onImportFolder }) {
  const [savedProjects, setSavedProjects] = useState([]);

  useEffect(() => {
    // 로컬 스토리지에서 저장된 프로젝트 목록 불러오기
    loadSavedProjects();
  }, []);

  const loadSavedProjects = () => {
    try {
      const projects = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('content-builder-project-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            const projectName = key.replace('content-builder-project-', '');
            projects.push({
              key: key,
              name: projectName,
              courseCode: data.courseCode || '',
              courseName: data.courseName || '',
              lessonCount: data.lessons?.length || 0,
              lastModified: data.lastModified || new Date().toISOString()
            });
          } catch (e) {
            // 잘못된 데이터는 무시
          }
        }
      }
      // 최근 수정일 순으로 정렬
      projects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      setSavedProjects(projects);
    } catch (error) {
      console.error('프로젝트 목록 불러오기 실패:', error);
    }
  };

  const handleLoadProject = (projectKey) => {
    try {
      const data = JSON.parse(localStorage.getItem(projectKey));
      onLoadProject(data);
    } catch (error) {
      alert('프로젝트를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleDeleteProject = (projectKey, e) => {
    e.stopPropagation();
    if (window.confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
      localStorage.removeItem(projectKey);
      loadSavedProjects();
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="home-screen">
      <div className="home-container">
        <div className="home-header">
          <h1>📚 Content Builder</h1>
          <p className="home-subtitle">IT 학위 콘텐츠 제작 도구</p>
        </div>

        <div className="home-actions">
          <button className="btn-home-primary" onClick={onNewProject}>
            <span className="btn-icon">✨</span>
            <div className="btn-content">
              <div className="btn-title">새 프로젝트 시작</div>
              <div className="btn-description">빈 프로젝트로 시작하기</div>
            </div>
          </button>

          <label className="btn-home-secondary">
            <span className="btn-icon">📥</span>
            <div className="btn-content">
              <div className="btn-title">JSON 파일 불러오기</div>
              <div className="btn-description">저장된 JSON 파일 불러오기</div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target.result);
                      onLoadProject(data);
                    } catch (error) {
                      alert('JSON 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
                    }
                  };
                  reader.readAsText(file);
                }
                e.target.value = ''; // 같은 파일 다시 선택 가능하도록
              }}
              style={{ display: 'none' }}
            />
          </label>

          <label className="btn-home-secondary">
            <span className="btn-icon">📂</span>
            <div className="btn-content">
              <div className="btn-title">폴더 구조 불러오기</div>
              <div className="btn-description">subjects 폴더 구조에서 불러오기</div>
            </div>
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={(e) => {
                if (onImportFolder) {
                  onImportFolder(e);
                }
              }}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {savedProjects.length > 0 && (
          <div className="saved-projects">
            <h2>저장된 프로젝트</h2>
            <div className="project-list">
              {savedProjects.map((project) => (
                <div
                  key={project.key}
                  className="project-card"
                  onClick={() => handleLoadProject(project.key)}
                >
                  <div className="project-info">
                    <div className="project-header">
                      <h3>{project.courseName || project.name}</h3>
                      <button
                        className="btn-delete-project"
                        onClick={(e) => handleDeleteProject(project.key, e)}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                    <div className="project-details">
                      <span className="project-code">{project.courseCode || '코드 없음'}</span>
                      <span className="project-lessons">{project.lessonCount}개 차시</span>
                    </div>
                    <div className="project-date">
                      최근 수정: {formatDate(project.lastModified)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

