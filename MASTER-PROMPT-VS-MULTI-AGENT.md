# เปรียบเทียบ Master Prompt กับ Multi-Agent

## สรุปสั้นที่สุด
- ถ้าต้องการใช้งานเร็ว เข้าใจง่าย ใช้คนเดียว: ใช้ `master-prompt-th.md`
- ถ้าต้องการแยกบทบาทชัด คุมคุณภาพเป็นขั้น และต่อระบบอัตโนมัติ: ใช้ `multi-agent`

## เปรียบเทียบแบบตาราง
| หัวข้อ | Master Prompt | Multi-Agent |
| --- | --- | --- |
| รูปแบบ | prompt เดียวรวมทุกบทบาท | หลาย agent แยกหน้าที่ |
| ความง่ายในการเริ่มใช้ | ง่ายมาก | ยากกว่า |
| ความเร็วในการใช้งาน | เร็ว | ช้ากว่าเล็กน้อย |
| ความละเอียดของการวิเคราะห์ | ดีในภาพรวม | ดีกว่าในงานซับซ้อน |
| การแยกหน้าที่ | ไม่แยกชัด | แยกชัด |
| การควบคุมคุณภาพรายขั้น | จำกัด | ดีกว่า |
| เหมาะกับงาน manual | มาก | ปานกลาง |
| เหมาะกับ automation | ปานกลาง | มาก |
| เหมาะกับโปรเจกต์เล็ก-กลาง | มาก | ได้ |
| เหมาะกับโปรเจกต์ซับซ้อน | ได้ แต่เริ่มปนง่าย | เหมาะกว่า |
| เหมาะกับการใช้งานตอนนี้ของโปรเจกต์นี้ | มากที่สุด | ยังไม่จำเป็น |

## Master Prompt ทำงานแทนอะไรบ้าง
ไฟล์ `requirement-agent-kit/shared/master-prompt-th.md` รวมหน้าที่ของ agent หลักหลายตัวไว้แล้ว ได้แก่

1. Discovery Agent
- ถามคำถามเพิ่มเมื่อข้อมูลไม่พอ
- หา gap สำคัญ
- แยก fact กับ unknown

2. Analyst Agent
- แปลงข้อมูลดิบเป็น requirement
- แยก functional และ non-functional requirements
- หา business rules และ assumptions

3. Architect Agent
- เสนอ solution options
- สรุป architecture เบื้องต้น
- ระบุ modules, data flow, integration points

4. Risk Agent
- หา ambiguity และ risk
- ระบุ dependency และสิ่งที่ต้องยืนยันก่อน build

5. Planner Agent
- แยก MVP scope
- สรุป roadmap
- สรุป estimate notes

## กรณีไหนควรใช้ Master Prompt
ใช้เมื่อ:

1. คุณต้องการเริ่มใช้งานเร็ว
2. คุณทำงานแบบ manual กับ AI โดยตรง
3. โปรเจกต์ยังไม่ซับซ้อนเกินไป
4. ยังไม่มีระบบ orchestration จริง
5. ต้องการใช้ร่วมกับ `demo-app` ตอนนี้เลย

## กรณีไหนควรใช้ Multi-Agent
ใช้เมื่อ:

1. โปรเจกต์มีหลาย workflow และหลาย integration
2. ต้องการให้ discovery, analysis, architecture, planning แยกกันชัดเจน
3. ต้องการคุมคุณภาพผลลัพธ์เป็นรายขั้น
4. จะต่อ backend หรือ workflow automation จริง
5. มีหลายคนในทีมใช้คนละบทบาท เช่น BA, SA, PM

## คำแนะนำสำหรับโปรเจกต์นี้
สำหรับ `software-บริหารจัดฝึกอบรบ` แนะนำให้ใช้แบบนี้ก่อน:

1. ใช้ `demo-app/index.html` เพื่อกรอกข้อมูล
2. copy ข้อความจากแท็บ `Brief สำหรับ Agent`
3. ใช้ `requirement-agent-kit/shared/master-prompt-th.md` เป็น system prompt
4. ให้ AI สร้างผลลัพธ์ requirement และแบบระบบ
5. เก็บผลที่ทบทวนแล้วใน `requirement-agent-kit/projects/<ชื่อโปรเจกต์>/final-output.md`

## Flow ที่แนะนำตอนนี้
```text
demo-app
-> Brief สำหรับ Agent
-> master-prompt-th.md
-> AI วิเคราะห์และออกแบบระบบ
-> final-output.md
```

## เมื่อไรค่อยขยับไป Multi-Agent
ให้พิจารณาขยับเมื่อเกิดอย่างน้อยหนึ่งข้อ:
- requirement เริ่มยาวและปนกันมาก
- มีหลายบริการ เช่น public training, in-house training, consulting ที่ flow ต่างกันชัด
- ต้องการถาม requirement เพิ่มเป็นรอบๆ
- ต้องการ architecture ละเอียดแยกตามโดเมน
- ต้องการให้ระบบทำงานอัตโนมัติไม่ต้อง copy/paste เอง

## ข้อสรุปสุดท้าย
ตอนนี้ `master-prompt-th.md` คือทางเลือกที่เหมาะที่สุดสำหรับคุณ
เพราะ:
- ใช้งานง่ายกว่า
- เหมาะกับการทดลองจริงตอนนี้
- ทำงานร่วมกับ `demo-app` ได้ตรงที่สุด
- ยังไม่ต้องรับภาระเรื่อง orchestration หลาย agent
