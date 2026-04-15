# วิธีใช้งาน Requirement Agent Kit

## เป้าหมาย
ใช้ชุดนี้เพื่อเก็บข้อมูลตั้งต้นของลูกค้า แล้วส่งต่อให้ Agent วิเคราะห์ requirement, ออกแบบระบบ และสรุปแผนงาน

## ถ้าต้องการกรอกผ่านหน้าเว็บ
1. เปิด `demo-app/index.html`
2. กรอกข้อมูลโครงการ
3. กด `สร้างผลลัพธ์`
4. ใช้แท็บ `Brief สำหรับ Agent` เป็น input ส่งเข้า AI
5. ถ้าต้องการให้ AI สร้างผลลัพธ์เลย ให้ใส่ API key แล้วใช้แท็บ `AI Final Output`

## ถ้าต้องการทำงานแบบไฟล์
1. ไปที่ `requirement-agent-kit/projects/`
2. copy โฟลเดอร์ `sample-project` แล้วเปลี่ยนชื่อเป็นโปรเจกต์จริง
3. กรอก `intake.json` หรือ `brief.md`
4. ใช้ `requirement-agent-kit/shared/master-prompt-th.md` เป็น system prompt
5. เอา `brief.md` ไปวางเป็น user prompt
6. เก็บผลลัพธ์ที่ได้ไว้ใน `final-output.md`

## ไฟล์สำคัญ
- `requirement-agent-kit/shared/master-prompt-th.md` : prompt หลักของ Agent
- `requirement-agent-kit/shared/output-template-th.md` : โครงสร้างผลลัพธ์ที่ต้องการ
- `requirement-agent-kit/shared/input-schema.json` : schema ของข้อมูลตั้งต้น
- `requirement-agent-kit/projects/` : โฟลเดอร์เก็บงานรายโปรเจกต์
- `demo-app/index.html` : ฟอร์มกรอกข้อมูลผ่านหน้าเว็บ

## คำอธิบายแบบสั้นมาก
- input = ข้อมูลลูกค้า
- prompt = กติกาการทำงานของ Agent
- output = requirement + solution + roadmap
