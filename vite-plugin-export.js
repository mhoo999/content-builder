import { spawn } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export default function exportSubjectsPlugin() {
  return {
    name: 'export-subjects',
    configureServer(server) {
      server.middlewares.use('/api/export-subjects', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { courseData, outputPath } = JSON.parse(body);

            if (!courseData || !courseData.courseCode) {
              res.statusCode = 400;
              res.end('과목 코드가 필요합니다.');
              return;
            }

            // 임시 JSON 파일 생성
            const tempFile = join(tmpdir(), `${courseData.courseCode}_builder_${Date.now()}.json`);
            writeFileSync(tempFile, JSON.stringify(courseData, null, 2), 'utf-8');

            // Python 스크립트 실행
            const scriptPath = join(process.cwd(), 'builder_to_subjects.py');
            // Windows는 'python', macOS/Linux는 'python3' 사용
            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
            const pythonProcess = spawn(pythonCmd, [scriptPath, tempFile, outputPath], {
              cwd: process.cwd(),
              stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
              stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
              stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
              // 임시 파일 삭제
              try {
                unlinkSync(tempFile);
              } catch (e) {
                // 파일 삭제 실패는 무시
              }

              if (code === 0) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  outputPath: outputPath,
                  lessonCount: courseData.lessons.length,
                  message: stdout
                }));
              } else {
                res.statusCode = 500;
                res.end(JSON.stringify({
                  success: false,
                  error: stderr || stdout || 'Python 스크립트 실행 실패'
                }));
              }
            });

            pythonProcess.on('error', (error) => {
              try {
                unlinkSync(tempFile);
              } catch (e) {}
              
              res.statusCode = 500;
              res.end(JSON.stringify({
                success: false,
                error: `Python 스크립트 실행 오류: ${error.message}`
              }));
            });

          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({
              success: false,
              error: error.message
            }));
          }
        });
      });
    }
  };
}

