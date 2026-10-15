# Chatbot RAG của Online Academy

## Tính năng và giới hạn

Chatbot tư vấn từ catalog công khai và hướng dẫn Markdown. Khách có hướng dẫn công khai; tài khoản đăng nhập nhận thêm hướng dẫn của đúng vai trò student, instructor hoặc admin. Quyền được xác định bằng JWT đã kiểm tra ở backend. Bot trả lời và dẫn liên kết để người dùng mở màn hình thao tác.

Bot chưa đọc video/transcript, tiến độ học, lịch sử mua, dữ liệu cá nhân hoặc thống kê quản trị. Các hướng dẫn về thao tác là kiến thức nghiệp vụ đã kiểm tra trong source; bot không thực hiện thao tác thay người dùng. Nếu nguồn thiếu quy định như hoàn tiền, đáp án cần nói chưa có thông tin.

Đây là RAG: tìm dữ liệu rồi đưa vào prompt của lượt hỏi. Tạo embedding không huấn luyện lại model. Qwen embedding biến văn bản thành vector; Qwen chat đọc văn bản các nguồn được chọn để viết đáp án.

## Tổ chức mã

```text
backend/src/config/chatbot.js                 Cấu hình tập trung
backend/src/modules/chatbot/
  routes/chatbot.api.routes.js                Router và rate limit
  controllers/chatbot.api.controller.js       HTTP input/output
  schemas/chatbot.schema.js                   Validation và chọn history
  repositories/chatbot.repository.js          Đọc catalog từ PostgreSQL
  services/knowledge.service.js               Nguồn Markdown, projection và chunk
  services/ollama.service.js                  HTTP Ollama, embedding và generation
  services/chatbot.service.js                 Đồng bộ index và điều phối hỏi đáp
backend/knowledge/chatbot/                    Hướng dẫn theo vai trò
backend/database/migrations/004_chatbot_pgvector.js  Extension vector và hai bảng nội bộ
backend/scripts/{migrate-chatbot,index-chatbot}.js    Migration riêng và đồng bộ ngay
client/src/features/chatbot/                  Widget React và CSS
```

Controller không truy vấn database. Service gọi repository để đọc dữ liệu, không nhận `req`/`res`. Repository chỉ chọn các trường công khai. Widget dùng HTTP/JWT client hiện có, không tự lưu token.

## Luồng lập chỉ mục tự động

Mỗi câu hỏi đi qua `synchronizeIndex()` trước retrieval:

1. `readKnowledge()` lấy khóa đang hiển thị bằng repository và đọc bốn file hướng dẫn được allowlist.
2. `courseDocument()` chuyển bản ghi khóa thành văn bản, dùng `sale_price ?? price` để giữ đúng ưu đãi bằng 0. `parseGuide()` gắn vai trò và đường dẫn cho từng mục Markdown.
3. `chunkDocuments()` chia theo đoạn; block dài có overlap. Tiêu đề lặp lại ở mỗi chunk, độ dài tối đa 800 ký tự.
4. `fingerprint()` tạo hash; repository đọc cấu hình và hash các chunk ở PostgreSQL. Model/cấu hình đổi thì không tái dùng embedding cũ.
5. `synchronizeIndex()` chỉ embedding phần văn bản mới. Văn bản không đổi giữ vector ngay trong database, không tải toàn bộ vector về JavaScript. Metadata thay đổi cũng được cập nhật.
6. Repository upsert chunk, xóa chunk không còn trong nguồn và cập nhật snapshot trong cùng transaction. `pg_advisory_xact_lock` chống đồng bộ chồng nhau giữa các process. Lỗi bất kỳ rollback toàn bộ; không trả lời từ nguồn đã biết là cũ.

Toàn bộ lượt hỏi trong một process vẫn xếp hàng để tránh embedding và chat tranh VRAM. Khi đủ nguồn, SQL lọc `audience` và trạng thái khóa học trước `ORDER BY embedding <=> query LIMIT 5`. Đây là cosine search chính xác trên corpus hiện tại, chưa dùng ANN/HNSW. Khóa bị ẩn được chặn ngay trong truy vấn; khóa bị xóa cascade các chunk tương ứng.

Không dùng `data/chatbot-index.json` hoặc `CHATBOT_INDEX_PATH` nữa. Markdown vẫn là file nguồn; embedding của Markdown được lưu trên Supabase giống embedding khóa học. Demo/test dùng bảng pgvector trong PostgreSQL tạm, không ghi Supabase.

## Xem vector trên Supabase và triển khai

Kết nối theo `DB_*` hiện có của backend. Trên database legacy, chạy đúng migration chatbot:

```powershell
node backend/scripts/migrate-chatbot.js
node backend/scripts/index-chatbot.js
```

Script migration chỉ chạy `004_chatbot_pgvector.js`, không kéo theo 001/002/003 còn pending. Script index chỉ tạo embedding và ghi các bảng chatbot, không gọi model sinh câu trả lời. Chạy lại an toàn: migration đã chạy trả danh sách rỗng, nội dung không đổi tái dùng vector. Chat vẫn tự đồng bộ khi tài liệu/khóa thay đổi.

Trong Supabase Table Editor, mở schema `public`, bảng `chatbot_chunks`: `id`, `course_id`, `audience`, `title`, `url`, `text`, `text_hash`, `embedding`, `updated_at`. Cột embedding là `vector(1024)`. `chatbot_index_state` có một dòng chứa model, dimensions, signature và snapshot hash.

```sql
select id, title, audience, vector_dims(embedding) as dimensions
from public.chatbot_chunks
order by id
limit 10;
```

Hai bảng bật RLS, không tạo policy đọc cho trình duyệt, thu hồi quyền `anon`/`authenticated` nếu các role này tồn tại. Backend dùng credential PostgreSQL riêng trên server để truy cập, rồi áp dụng vai trò JWT trước retrieval. Không đưa mật khẩu DB hoặc service key ra React. [Tài liệu pgvector trên Supabase](https://supabase.com/docs/guides/database/extensions/pgvector).

## Luồng một câu hỏi cụ thể

Ví dụ khách hỏi: “Tôi muốn học React, có khóa nào phù hợp và giá bao nhiêu?”

1. `ChatbotWidget.submit()` gửi `POST /api/v1/chatbot/messages` với `question` và các cặp history đã thành công.
2. `optionalApiUser()` nhận thấy không có Authorization nên cho đi với quyền khách. Nếu có token thì phải kiểm tra, token sai không được hạ xuống quyền khách.
3. Rate limiter chọn bucket tài khoản hoặc IP. `sendMessage()` gọi `chatInput()` để kiểm tra input rồi truyền vai trò máy chủ vào service.
4. `answer()` chờ đồng bộ index. `retrievalQuestion()` thêm tối đa hai câu hỏi trước làm ngữ cảnh; không dùng đáp án cũ làm chứng cứ.
5. Embedding query có instruction tiếng Anh. Văn bản nguồn được embedding trực tiếp, không thêm instruction đó.
6. `ChatbotRepository.search()` lọc public + đúng vai trò và khóa học còn hiển thị trong SQL trước khi chấm cosine và chọn tối đa 5 chunk. Khách không thể tìm hướng dẫn admin bằng cách tự nhận là admin trong câu hỏi.
7. `buildMessages()` tạo `system → history → user chứa nguồn hiện tại và câu hỏi`. Mỗi nguồn có mã [S1]...[S5] của lượt này.
8. `generate()` gửi payload tới Ollama; chỉ đọc câu trả lời cuối ở `message.content`.
9. `citationWarnings()` kiểm tra mã trích dẫn. `answer()` trả `answer`, nguồn chứa đoạn trích và URL chính thức, cùng `warnings`; không trả prompt/vector.
10. React render text an toàn, cho mở các nguồn và liên kết. Chỉ cặp hỏi/đáp thành công mới được thêm vào history.

Cosine là điểm xếp hạng, không phải phần trăm chính xác. Kiểm tra citation chỉ xác nhận mã có trong context; một mã hợp lệ vẫn có thể bị model dùng sai ý. Cần đọc nguồn để kiểm tra câu trả lời thực tế.

## Chức năng từng hàm xử lý

| Hàm | Đầu vào và trách nhiệm |
|---|---|
| `positiveInteger()` trong config | Đọc timeout từ env, từ chối giá trị không phải số nguyên dương. |
| `optionalApiUser()` | Middleware dùng quyền khách khi thiếu header; khi có header, tái dùng kiểm tra JWT và trạng thái tài khoản. |
| `chatInput()` | Chỉ nhận question/history; kiểm tra câu hỏi 1–2000 ký tự và từ chối role/userId do client gửi. |
| `selectHistory()` | Kiểm tra cặp user/assistant; chọn tối đa 3 cặp/4000 ký tự, cắt từng message tối đa 1000 ký tự và bỏ citation cũ trong đáp án. |
| `sendMessage()` | Chuyển request hợp lệ cùng vai trò đã xác thực sang service, trả response theo `{ data }`. |
| `health()` controller | Trả trạng thái chatbot qua response helper chung. |
| `ChatbotRepository.publicCourses()` | Truy vấn khóa `is_disabled = false`, join tên danh mục/giảng viên và chỉ chọn trường công khai. Không tăng view count. |
| `plainText()` | Bỏ tag, script/style và chuẩn hóa entity/whitespace từ mô tả HTML để embedding. |
| `courseDocument()` | Tạo văn bản có tên, danh mục, giảng viên, giá, đánh giá, mô tả; gắn ID và URL khóa học. Khi thiếu mô tả chi tiết, dùng mô tả ngắn sẵn có cho nội dung tư vấn. |
| `parseGuide()` | Đọc từng mục hướng dẫn, kiểm tra đường dẫn allowlist và gắn audience từ file do server cấu hình. |
| `readKnowledge()` | Ghép tài liệu từ repository với các file hướng dẫn cố định. Không đọc mọi file tùy ý trong thư mục. |
| `chunkDocuments()` | Chia nguồn thành chunk, giữ metadata, lặp tiêu đề và overlap khi đoạn quá dài. |
| `fingerprint()` | SHA-256 của dữ liệu JSON; phát hiện thay đổi nguồn/cấu hình và tìm vector tái dùng. |
| `cosineSimilarity()` | Kiểm tra số chiều, giá trị hữu hạn, vector khác 0 rồi tính độ tương đồng. |
| `createOllamaClient()` | Tạo client với URL/timeout; có thể thay transport khi test. |
| `request()` trong Ollama client | Gọi HTTP, kiểm tra JSON và chuyển lỗi kết nối/model/timeout sang lỗi ứng dụng. |
| `modelsReady()` | Đọc model đã cài từ `/api/tags`; không tạo embedding. |
| `embed()` | Gọi `/api/embed` theo batch và kiểm tra vector nhận lại. |
| `generate()` | Gọi `/api/chat`, không stream, tách nội dung cuối khỏi thinking và phát hiện đáp án rỗng/bị cắt. |
| `retrievalQuestion()` | Ghép câu hiện tại với tối đa hai câu hỏi cũ để hiểu chủ đề nối tiếp. |
| `ChatbotRepository.search()` | Lọc audience/trạng thái khóa trong SQL, xếp hạng bằng `<=>`, lấy top 5 và cấp mã nguồn theo lượt. |
| `buildMessages()` | Ghép chỉ dẫn nghiệp vụ, history và văn bản nguồn; không đưa URL do model tự sinh vào UI. |
| `citationWarnings()` | Cảnh báo mã không tồn tại và câu trả lời thiếu citation; không đánh giá tính đúng của từng ý. |
| `createChatbotService()` | Tạo service có hàng đợi; test dùng transport giả và PostgreSQL tạm có pgvector thật. |
| `readCurrentChunks()` | Đọc nguồn hiện tại, chia chunk, báo lỗi kiến thức không sẵn sàng. |
| `ChatbotRepository.readIndex()` | Đọc trạng thái và hash các chunk trên PostgreSQL, không tải vector để xếp hạng trong JavaScript. |
| `ChatbotRepository.withIndexLock()` | Transaction cùng advisory lock, dùng một connection cho nguồn, đồng bộ và retrieval. |
| `ChatbotRepository.replaceIndex()` | Bulk upsert, tái dùng embedding trong SQL, loại nguồn cũ và cập nhật snapshot atomically. |
| `vectorLiteral()` | Kiểm tra đúng 1024 số hữu hạn, khác vector 0 rồi serialize cho parameter binding. |
| `enqueue()` | Xếp hàng tác vụ index/chat để giữ chính sách VRAM trong một process. |
| `indexMatches()` | Đối chiếu signature, snapshot và từng ID/hash để phát hiện chunk thiếu hoặc thay đổi. |
| `withIndex()` | Thực hiện transaction qua repository và ánh xạ lỗi database thành lỗi chatbot. |
| `synchronize()` | Cho CLI đồng bộ kho vector mà không gọi generation. |
| `migrateChatbot()` | Áp dụng riêng migration 004, không chạy migration nghiệp vụ khác. |
| `synchronizeIndex()` | Đồng bộ trong lượt đã được xếp hàng, tái dùng vector, embedding phần đổi và ghi index atomically. |
| `answer()` | Xếp hàng lượt hỏi trong cùng process rồi điều phối history → sync → query embedding → nguồn → prompt → generation → response. |
| `health()` service | Kiểm tra model, khả năng đọc nguồn và index; `needs_sync` vẫn sẵn sàng vì lượt chat sẽ đồng bộ. |

Trong widget: `currentIdentity()` đối chiếu tài khoản hiện tại trước khi nhận đáp án; `close()` đóng khung và trả focus về nút mở; `checkHealth()` đọc trạng thái phụ thuộc; `submit()` gửi chat và chỉ lưu cặp thành công; `reset()` xóa hội thoại trong tab. Effects hủy request khi unmount, focus khi mở và cuộn tới tin mới. Layout gắn key theo ID + role để đổi danh tính tạo widget mới.

## Sửa hướng dẫn và thêm nội dung

Mở file phù hợp: `public.md`, `student.md`, `instructor.md`, `admin.md`. Mỗi mục có dạng:

```markdown
## Tên mục | /courses
Nội dung hướng dẫn đã được xác nhận trong website.
```

Đường dẫn phải thuộc allowlist của file trong `knowledge.service.js`. Nếu thêm hướng dẫn cho một màn hình mới, kiểm tra màn hình/route thật rồi bổ sung allowlist tương ứng. Không đặt mật khẩu, thông tin tài khoản, khóa truy cập hoặc chính sách chưa xác nhận trong hướng dẫn. Lưu file; lượt hỏi tiếp theo tự cập nhật embedding phần đổi.

Để sửa dữ liệu khóa, dùng chức năng giảng viên/admin hiện tại. Đổi tiêu đề, mô tả, giá, tên danh mục/giảng viên hoặc rating sẽ được phát hiện từ projection công khai, kể cả khi `updated_at` không đổi. Ẩn hoặc xóa khóa sẽ loại nguồn khỏi lượt hỏi tiếp theo.

## Cấu hình và chạy

Mở Ollama; cần `qwen3:4b` và `qwen3-embedding:0.6b`. `npm run dev` chạy website với cấu hình database hiện tại; `npm run dev:demo` dùng database và index tạm. `npm run build` rồi `npm start` dùng React production.

Các biến trong `backend/.env`: `OLLAMA_URL`, `CHAT_MODEL`, `EMBEDDING_MODEL`, `CHATBOT_TIMEOUT_MS`; kết nối vector dùng cùng `DB_*` với dữ liệu khóa học. `CHATBOT_INDEX_PATH` đã bỏ. Đổi embedding model sẽ làm index được tạo lại; đổi chat model không cần embedding lại. Ollama chỉ được gọi từ backend.

History tối đa 3 cặp và 4000 ký tự; UI giữ tối đa 6 message, mỗi message cắt 1000 ký tự trước khi gửi. Backend kiểm tra độc lập. Tải lại/đăng xuất/đổi tài khoản xóa cuộc trò chuyện. Không có bảng lưu hội thoại. Rate limit 10 lượt/phút theo tài khoản hoặc IP khách, lưu trong bộ nhớ process.

Retrieval `topK = 5` là số nguồn, khác với generation `top_k = 20` là tham số lấy mẫu token. Generation có `think: true`, `num_ctx: 8192`, `num_predict: 4096`, timeout mặc định 180 giây cho mỗi request Ollama. Tổng một lượt có thể dài hơn timeout nếu phải embedding nhiều batch hoặc chờ lượt trước.

Smoke thực tế trên GPU local đã gặp `CUDA out of memory` khi model embedding và chat cùng chiếm VRAM. Vì vậy payload cả hai dùng `keep_alive: 0` và các lượt hỏi được xếp hàng tuần tự trong process. Model được nạp lại khi cần, có thể tăng độ trễ. Đây là chính sách của ứng dụng; không thay đổi cấu hình Ollama toàn máy. Xem tham số [keep_alive của embedding](https://docs.ollama.com/api/embed) và [hướng dẫn quản lý bộ nhớ model](https://docs.ollama.com/faq#how-do-i-keep-a-model-loaded-in-memory-or-make-it-unload-immediately).

## Kiểm tra

`npm test` chạy các kiểm tra backend/client. Test chatbot dùng PostgreSQL nhúng, Ollama HTTP giả và thư mục hướng dẫn tạm. Extension `@electric-sql/pglite-pgvector` cho phép chạy kiểu vector, cosine SQL và RLS thật trong test. Bao phủ validation, JWT/role, nguồn công khai, cache, thay đổi KB/khóa, nguồn bị ẩn/xóa, đồng bộ đồng thời, khôi phục chunk thiếu, rollback khi lưu lỗi, tái dùng vector khi ID đổi, role/RLS, model lỗi và rate limit.

`npm run build` rồi `npm run test:e2e` chạy Chromium với demo database và Ollama giả ở 11435; kiểm tra widget thật qua API, desktop/mobile, history, link nguồn, lỗi, reset, reload và chuyển tài khoản khi request chưa xong. Hình kiểm tra ở `client/test-results/`.

`node backend/scripts/chatbot-smoke.js` chạy sáu câu hỏi bằng Ollama thật và demo database tạm, cần cổng 4100 trống. Báo cáo JSON nằm trong thư mục tạm; có thể đặt `CHATBOT_SMOKE_REPORT` để chọn đường dẫn. Test giả chứng minh luồng xử lý; smoke thật mới cho thấy chất lượng đáp án của model trên máy tại thời điểm chạy.

## Đối chiếu với mẫu Lumen

Giữ nguyên ý tưởng chunk → embedding → cosine → context → generation; giữ history có budget và citation theo lượt. Đổi nguồn một KB thành catalog + hướng dẫn phân quyền; index thủ công thành tự đồng bộ; mã [Sx] theo section thành theo nguồn mỗi lượt; chuyển UI DOM thuần sang widget React dùng JWT client hiện có.

Không mang sang các quy tắc riêng Lumen về học phí, chương trình, ngày sửa đổi, Section 11 hoặc `examMode`. Prompt, projection dữ liệu và quyền truy xuất được viết cho Online Academy. Vector store hiện là PostgreSQL pgvector trên Supabase. Model chat và embedding vẫn chạy local bằng Ollama; không thêm framework RAG.
