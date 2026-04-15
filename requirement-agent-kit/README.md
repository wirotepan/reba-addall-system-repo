# Requirement Agent Kit

ชุดนี้ใช้สำหรับเก็บ requirement ลูกค้า, สร้าง brief ส่งเข้า AI, และจัดเก็บผลลัพธ์รายโปรเจกต์แบบแยกงานต่อโฟลเดอร์

## โครงสร้าง
```text
requirement-agent-kit/
  shared/
    master-prompt-th.md
    output-template-th.md
    input-schema.json
    shared-state-schema.json
    output-schema.json
  projects/
    sample-project/
      intake.json
      brief.md
      final-output.md
      notes.md
```

## วิธีใช้เร็วสุด
1. สร้างโฟลเดอร์ใหม่ใต้ `projects/` สำหรับแต่ละงานลูกค้า
2. เก็บข้อมูลตั้งต้นเป็น `intake.json`
3. สร้าง brief จากฟอร์มหรือกรอกเอง แล้วเก็บเป็น `brief.md`
4. ใช้ `shared/master-prompt-th.md` เป็น system prompt
5. เอา `brief.md` ไปวางเป็น user prompt
6. บันทึกผลลัพธ์ที่ผ่านการทบทวนแล้วเป็น `final-output.md`

## หมายเหตุ
- `shared/` คือไฟล์กลาง ใช้ซ้ำได้ทุกโปรเจกต์
- `projects/` คือพื้นที่เก็บงานแต่ละลูกค้าแยกกัน
- ถ้าต้องการ UI กรอกฟอร์ม ให้คัด `demo-app/` จาก repo ต้นทางมาเพิ่มภายหลังได้
