import { spawn } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import archiver from 'archiver';

export default function exportSubjectsPlugin() {
  return {
    name: 'export-subjects',
    configureServer(server) {
      // /api/export - ZIP 파일 반환 (Vercel api/export.py와 동일한 동작)
      server.middlewares.use('/api/export', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        const chunks = [];
        req.on('data', chunk => {
          chunks.push(chunk);
        });

        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString('utf-8');
            const { courseData } = JSON.parse(body);

            if (!courseData || !courseData.courseCode) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '과목 코드가 필요합니다.' }));
              return;
            }

            const courseCode = courseData.courseCode;

            // 임시 디렉토리 생성
            const tempDir = join(tmpdir(), `export_${Date.now()}`);
            const tempFile = join(tempDir, `${courseCode}_builder.json`);
            const outputDir = join(tempDir, 'output');

            // 디렉토리 생성
            const { mkdirSync } = await import('node:fs');
            mkdirSync(tempDir, { recursive: true });
            mkdirSync(outputDir, { recursive: true });

            // JSON 파일 저장
            writeFileSync(tempFile, JSON.stringify(courseData, null, 2), 'utf-8');

            // Python 스크립트 실행
            const scriptPath = join(process.cwd(), 'api', 'builder_to_subjects.py');
            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

            const pythonProcess = spawn(pythonCmd, [scriptPath, tempFile, outputDir], {
              cwd: process.cwd(),
              stdio: 'pipe',
              env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8'
              }
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
              stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
              stderr += data.toString();
            });

            pythonProcess.on('close', async (code) => {
              if (code !== 0) {
                // 임시 파일 정리
                try { rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: stderr || stdout || 'Python 스크립트 실행 실패'
                }));
                return;
              }

              try {
                // ZIP 파일 생성
                const courseDir = join(outputDir, courseCode);

                if (!existsSync(courseDir)) {
                  throw new Error(`출력 디렉토리를 찾을 수 없습니다: ${courseDir}`);
                }

                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename="${courseCode}.zip"`);

                const archive = archiver('zip', { zlib: { level: 9 } });

                archive.on('error', (err) => {
                  throw err;
                });

                archive.pipe(res);

                // courseCode 폴더를 ZIP의 루트에 포함
                archive.directory(courseDir, courseCode);

                archive.finalize();

                // ZIP 전송 완료 후 임시 파일 정리
                archive.on('end', () => {
                  try { rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
                });

              } catch (err) {
                try { rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });

            pythonProcess.on('error', (error) => {
              try { rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: `Python 스크립트 실행 오류: ${error.message}`
              }));
            });

          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });

      // /api/export-subjects - 기존 로컬 폴더 생성 엔드포인트 (유지)
      server.middlewares.use('/api/export-subjects', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        const chunks = [];
        req.on('data', chunk => {
          chunks.push(chunk);
        });

        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString('utf-8');
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
              stdio: 'pipe',
              env: {
                ...process.env,
                PYTHONIOENCODING: 'utf-8'  // Windows 인코딩 문제 해결
              }
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

