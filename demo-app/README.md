# Demo App

## Purpose
Static mini app for collecting customer requirement intake in Thai and generating:
- JSON payload for `../requirement-agent-kit/shared/input-schema.json`
- markdown brief for `../requirement-agent-kit/shared/master-prompt-th.md`
- mock final output for review and demo use

## Features
- professional Thai intake form suitable for customers or discovery workshops
- basic validation for required and high-value fields
- save and load projects with localStorage
- import and export project JSON files
- copy output from the current tab
- download outputs as `.json` and `.md`
- preview a mock final package from the provided intake
- generate AI final output using OpenAI API directly from the browser

## How To Run
1. Open `index.html` directly in a browser.
2. Fill in the form or click `Load Sample`.
3. Review the validation notice if any key data is missing.
4. Click `สร้างผลลัพธ์`.
5. Copy or download the generated output.

## Project Reuse
1. Enter a project storage name.
2. Click `บันทึกลงเครื่องนี้` to keep it in the browser.
3. Click `ส่งออกไฟล์โครงการ` to share or archive the project.
4. Use `นำเข้าไฟล์โครงการ` to continue work on another machine.

## OpenAI API Use
1. Paste your OpenAI API key.
2. Confirm the model name.
3. Optionally add extra instructions.
4. Click `สร้าง AI Final Output`.

Important:
- The request is sent directly from your browser to OpenAI.
- This app does not automatically persist your API key.
- For production use inside an organization, a backend proxy is safer.
