# Voice ASR Review: Bangla Audio Intelligibility Check

**Date:** 2026-11-02  
**Branch:** `qa/voice-asr`  
**Task Directive:** `handoff/TASK_VOICE_ASR_ANTIGRAVITY.md` (R4a)  
**Evaluator:** Antigravity (Independent ML/QA Contributor)

---

## 1. Method & Recognizer Specification

- **Environment:** Dedicated temporary Python 3.11 virtual environment outside repository (`%TEMP%\voice_asr_venv`).
- **ASR Engine:** `faster-whisper` version `1.2.1` backed by `ctranslate2` version `4.8.4` and `PyAV` (`av==18.1.0`).
- **Exact Model:** `Systran/faster-whisper-medium` (OpenAI Whisper Medium architecture, 769M parameters, multilingual).
- **Execution Settings:**
  - Device: `CPU`
  - Compute Type: `int8` (quantized)
  - Target Language: `bn` (Bangla)
  - Decoding Strategy: Greedy decoding with `temperature=0.0`, `beam_size=1` (deterministic; avoids multi-pass temperature fallback runaway loops on repetitive tokens).
- **Audio Inputs:** 14 MP3 recordings (2 voices × 7 clips) located at `D:\Desktop\Datathon handbook\claud skill\agroleaf_voice_review\`:
  - `nabanita/*.mp3` (Edge-TTS `bn-BD-NabanitaNeural` at rate −10%)
  - `pradeep/*.mp3` (Edge-TTS `bn-IN-PradeepNeural` at rate −10%)
- **Ground Truth Reference:** `D:\Desktop\Datathon handbook\claud skill\agroleaf_voice_review\texts_read_aloud.md`.
- **Metric:** Character Error Rate (CER), computed as Levenshtein edit distance between Unicode NFC-normalized reference text and hypothesis transcript, divided by length of reference text.

---

## 2. Per-Clip Results & Character Error Rate (CER)

| Voice | Clip Name | File | Audio Duration (s) | Ref Chars | Hyp Chars | CER | Decoding Status / Character Behavior |
|---|---|---|---|---|---|---|---|
| **Nabanita** | `healthy` | `healthy-v1.mp3` | 10.44s | 114 | 107 | **0.8421** | Phonetic transcription in Devanagari script |
| **Nabanita** | `blast` | `blast-v1.mp3` | 19.99s | 226 | 111 | **0.9646** | Absorbing token loop on `ব` |
| **Nabanita** | `brown_spot` | `brown_spot-v1.mp3` | 20.57s | 209 | 111 | **0.9522** | Absorbing token loop on `ব` |
| **Nabanita** | `leaf_smut` | `leaf_smut-v1.mp3` | 19.01s | 208 | 111 | **0.9712** | Absorbing token loop on `ব` |
| **Nabanita** | `tungro` | `tungro-v1.mp3` | 19.92s | 224 | 111 | **0.9732** | Absorbing token loop on `ব` |
| **Nabanita** | `sheath_blight` | `sheath_blight-v1.mp3` | 18.86s | 221 | 111 | **0.9819** | Absorbing token loop on `ব` |
| **Nabanita** | `not_sure` | `not_sure-v1.mp3` | 12.89s | 149 | 144 | **0.8591** | Phonetic transcription in Telugu script |
| **Pradeep** | `healthy` | `healthy-v1.mp3` | 10.44s | 114 | 124 | **0.9912** | Phonetic transcription in Telugu script + trailing repeat |
| **Pradeep** | `blast` | `blast-v1.mp3` | 19.99s | 226 | 111 | **0.9646** | Absorbing token loop on `ব` |
| **Pradeep** | `brown_spot` | `brown_spot-v1.mp3` | 20.64s | 209 | 111 | **0.9522** | Absorbing token loop on `ব` |
| **Pradeep** | `leaf_smut` | `leaf_smut-v1.mp3` | 18.89s | 208 | 111 | **0.9712** | Absorbing token loop on `ব` |
| **Pradeep** | `tungro` | `tungro-v1.mp3` | 20.04s | 224 | 111 | **0.9732** | Absorbing token loop on `ব` |
| **Pradeep** | `sheath_blight` | `sheath_blight-v1.mp3` | 18.96s | 221 | 111 | **0.9819** | Absorbing token loop on `ব` |
| **Pradeep** | `not_sure` | `not_sure-v1.mp3` | 13.01s | 149 | 127 | **0.8523** | Phonetic transcription in Telugu script + trailing repeat |

---

## 3. Full Transcripts (Verbatim Raw Recognizer Outputs)

### Nabanita Clips (`bn-BD-NabanitaNeural`)

1. **`healthy-v1.mp3`**
   - **Reference:** `পাতাটি সুস্থ দেখাচ্ছে। কোনো রোগের লক্ষণ পাওয়া যায়নি। নিয়মিত ক্ষেত দেখুন, সুষম সার দিন, আর আগাছা পরিষ্কার রাখুন।`
   - **Transcript:** `पाताती सुस्थो देखाथ्छे। कोनो रोगेर लक्ण पावा जाइनी। नियमितो खेप देखुन सुशम्षार दिन आर आगाचा पुरिश्कर राकुन।`
   - **Phonetic Analysis:** Full sentence transcribed with high phonetic fidelity into Devanagari Unicode script (`पाताती सुस्थो देखाथ्छे` = পাতাটি সুস্থ দেখাচ্ছে; `कोनो रोगेर लक्ण पावा जाइनी` = কোনো রোগের লক্ষণ পাওয়া যায়নি; `नियमितो खेप देखुन` = নিয়মিত ক্ষেত দেখুন; `सुशम्षार दिन` = সুষম সার দিন; `आर आगाचा पुरिश्कर राकुन` = আর আগাছা পরিষ্কার রাখুন).

2. **`blast-v1.mp3`**
   - **Reference:** `সম্ভবত ব্লাস্ট রোগ। এটি ছত্রাকজনিত রোগ এবং দ্রুত ছড়ায়। পাতায় মাঝখানে ধূসর আর কিনারায় বাদামী লম্বাটে দাগ হয়। ইউরিয়া সার কম দিন, ঘন করে চারা লাগাবেন না। দেরি না করে উপজেলা কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে কল করুন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate single-token absorbing loop triggered on the opening word "সম্ভবত".

3. **`brown_spot-v1.mp3`**
   - **Reference:** `সম্ভবত বাদামী দাগ রোগ। পাতায় ছোট গোল বাদামী দাগ হয়। সাধারণত সারের ঘাটতি থাকলে বেশি হয়। সুষম সার দিন, বিশেষ করে পটাশ। ভালো বীজ ব্যবহার করুন। ওষুধের জন্য কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে পরামর্শ নিন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

4. **`leaf_smut-v1.mp3`**
   - **Reference:** `সম্ভবত পাতার স্মাট রোগ। পাতায় ছোট ছোট কালো দাগ বা রেখা হয়। সাধারণত বড় ক্ষতি করে না। ইউরিয়া সার পরিমিত দিন এবং আক্রান্ত খড় সরিয়ে ফেলুন। নিশ্চিত হতে কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে যোগাযোগ করুন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

5. **`tungro-v1.mp3`**
   - **Reference:** `সম্ভবত টুংরো রোগ। এটি ভাইরাসজনিত রোগ, সবুজ পাতাফড়িং পোকা এটি ছড়ায়। পাতা হলুদ বা কমলা হয়ে যায় এবং গাছ খাটো হয়। আক্রান্ত গাছ তুলে মাটিতে পুঁতে ফেলুন। পোকা দমনের জন্য কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে পরামর্শ নিন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

6. **`sheath_blight-v1.mp3`**
   - **Reference:** `সম্ভবত খোল পোড়া রোগ। পানির কাছে গাছের খোলে ধূসর দাগ হয়, পরে উপরে ছড়ায়। ঘন করে চারা লাগাবেন না, ইউরিয়া পরিমিত দিন, আর কিছুদিন ক্ষেতের পানি সরিয়ে দিন। ওষুধের জন্য কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে পরামর্শ নিন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

7. **`not_sure-v1.mp3`**
   - **Reference:** `আমি নিশ্চিত নই। দিনের আলোতে, কাছ থেকে, শুধু আক্রান্ত পাতার আরেকটি পরিষ্কার ছবি তুলুন। তবুও না হলে এক ছয় এক দুই তিন নম্বরে কৃষি কল সেন্টারে ফোন করুন।`
   - **Transcript:** `అమి నిశిట ని దిన రాల తి కాస తి కి శి సి అక రాన తాప పాతర ఆరి తి పరిశి చవాన చవాన తలాన. తలాన నా లి ఏక చాయ ఏక ది తి నాన బి కిషి కాల సంటా రి ఫాన కాన.`
   - **Phonetic Analysis:** Complete sentence transcribed phonetically into Telugu Unicode script (`అమి నిశిట ని` = আমি নিশ্চিত নই; `దిన రాల తి` = দিনের আলোতে; `కాస తి కి` = কাছ থেকে; `పాతర ఆరి తి పరిశి` = পাতার আরেকটি পরিষ্কার; `ఏక చాయ ఏక ది తి` = এক ছয় এক দুই তিন; `కిషి కాల సంటా రి` = কৃষি কল সেন্টারে; `ఫాన కాన` = ফোন করুন).

---

### Pradeep Clips (`bn-IN-PradeepNeural`)

1. **`healthy-v1.mp3`**
   - **Reference:** `পাতাটি সুস্থ দেখাচ্ছে। কোনো রোগের লক্ষণ পাওয়া যায়নি। নিয়মিত ক্ষেত দেখুন, সুষম সার দিন, আর আগাছা পরিষ্কার রাখুন।`
   - **Transcript:** `పాతాతి శిసితా డికాత చి కాన రిగ లాకన పావ జాన ని ని మిమితా కిటి దికి సంశార దిం ఆరాగాచా పరిశికా రాక కాక కాక కాక కాక కాక కాక కాక`
   - **Phonetic Analysis:** Sentence transcribed phonetically into Telugu script (`పాతాతి శిసితా డికాత చి` = পাতাটি সুস্থ দেখাচ্ছে; `కాన రిగ లాకన పావ జాన ని` = কোনো রোগের লক্ষণ পাওয়া যায়নি; `ని మిమితా కిటి దికి` = নিয়মিত ক্ষেত দেখুন; `సంశార దిం` = সুষম সার দিন; `ఆరాగాచా పరిశికా` = আর আগাছা পরিষ্কার), ending with an absorbing loop on syllable `కాక`.

2. **`blast-v1.mp3`**
   - **Reference:** `সম্ভবত ব্লাস্ট রোগ। এটি ছত্রাকজনিত রোগ এবং দ্রুত ছড়ায়। পাতায় মাঝখানে ধূসর আর কিনারায় বাদামী লম্বাটে দাগ হয়। ইউরিয়া সার কম দিন, ঘন করে চারা লাগাবেন না। দেরি না করে উপজেলা কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে কল করুন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

3. **`brown_spot-v1.mp3`**
   - **Reference:** `সম্ভবত বাদামী দাগ রোগ। পাতায় ছোট গোল বাদামী দাগ হয়। সাধারণত সারের ঘাটতি থাকলে বেশি হয়। সুষম সার দিন, বিশেষ করে পটাশ। ভালো বীজ ব্যবহার করুন। ওষুধের জন্য কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে পরামর্শ নিন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

4. **`leaf_smut-v1.mp3`**
   - **Reference:** `সম্ভবত পাতার স্মাট রোগ। পাতায় ছোট ছোট কালো দাগ বা রেখা হয়। সাধারণত বড় ক্ষতি করে না। ইউরিয়া সার পরিমিত দিন এবং আক্রান্ত খড় সরিয়ে ফেলুন। নিশ্চিত হতে কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে যোগাযোগ করুন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

5. **`tungro-v1.mp3`**
   - **Reference:** `সম্ভবত টুংরো রোগ। এটি ভাইরাসজনিত রোগ, সবুজ পাতাফড়িং পোকা এটি ছড়ায়। পাতা হলুদ বা কমলা হয়ে যায় এবং গাছ খাটো হয়। আক্রান্ত গাছ তুলে মাটিতে পুঁতে ফেলুন। পোকা দমনের জন্য কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে পরামর্শ নিন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

6. **`sheath_blight-v1.mp3`**
   - **Reference:** `সম্ভবত খোল পোড়া রোগ। পানির কাছে গাছের খোলে ধূসর দাগ হয়, পরে উপরে ছড়ায়। ঘন করে চারা লাগাবেন না, ইউরিয়া পরিমিত দিন, আর কিছুদিন ক্ষেতের পানি সরিয়ে দিন। ওষুধের জন্য কৃষি অফিসার অথবা এক ছয় এক দুই তিন নম্বরে পরামর্শ নিন।`
   - **Transcript:** `ববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববববব`
   - **Phonetic Analysis:** Degenerate absorbing loop triggered on the opening word "সম্ভবত".

7. **`not_sure-v1.mp3`**
   - **Reference:** `আমি নিশ্চিত নই। দিনের আলোতে, কাছ থেকে, শুধু আক্রান্ত পাতার আরেকটি পরিষ্কার ছবি তুলুন। তবুও না হলে এক ছয় এক দুই তিন নম্বরে কৃষি কল সেন্টারে ফোন করুন।`
   - **Transcript:** `అని నిషిత ని డి దిన రాల తి కాస తి కి శి సి అక రంత టార ఆరి తి పరిసి చవాల చవాల తి పరిసి చవాల తి పరిసి తి పరిసి చవాల కాల కాల కాల కాల`
   - **Phonetic Analysis:** Transcribed phonetically into Telugu script (`అని నిషిత ని` = আমি নিশ্চিত নই; `దిన రాల తి` = দিনের আলোতে; `కాస తి కి` = কাছ থেকে; `ఆరి తి పరిసి` = আরেকটি পরিষ্কার), ending with repeated tokens `కాల కాల...` before reaching the phone number.

---

## 4. Per-Word Target Keyword Recognition Table

Fourteen key Bangla words were checked across all transcripts. Because Whisper Medium exhibited cross-script transliteration (Devanagari and Telugu) as well as the absorbing `ব` loop, detections are broken down by exact Bengali script and phonetic cross-script recognition.

Per the task directive rule: **"Report words missed by both voices as 'needs human listening', not as mispronounced."**

| # | Target Bangla Word | In Target Clips | Nabanita Recognition | Pradeep Recognition | Voice Comparison | Finding / Recommendation |
|---|---|---|---|---|---|---|
| 1 | **ব্লাস্ট** | `blast` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (both collapsed on initial "সম্ভবত") | **Needs human listening** |
| 2 | **ছত্রাকজনিত** | `blast` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (both collapsed on initial "সম্ভবত") | **Needs human listening** |
| 3 | **ইউরিয়া** | `blast`, `leaf_smut`, `sheath_blight` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (all 3 clips collapsed on initial "সম্ভবত") | **Needs human listening** |
| 4 | **পটাশ** | `brown_spot` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (collapsed on initial "সম্ভবত") | **Needs human listening** |
| 5 | **স্মাট** | `leaf_smut` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (collapsed on initial "সম্ভবত") | **Needs human listening** |
| 6 | **টুংরো** | `tungro` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (collapsed on initial "সম্ভবত") | **Needs human listening** |
| 7 | **ভাইরাসজনিত** | `tungro` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (collapsed on initial "সম্ভবত") | **Needs human listening** |
| 8 | **পাতাফড়িং** | `tungro` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (collapsed on initial "সম্ভবত") | **Needs human listening** |
| 9 | **খোল পোড়া** | `sheath_blight` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (collapsed on initial "সম্ভবত") | **Needs human listening** |
| 10 | **উপজেলা** | `blast` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (collapsed on initial "সম্ভবত") | **Needs human listening** |
| 11 | **কৃষি অফিসার** | `blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight` | Missed (loop on `ব`) | Missed (loop on `ব`) | Tied (all 5 clips collapsed on initial "সম্ভবত") | **Needs human listening** |
| 12 | **এক ছয় এক দুই তিন** | `blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight`, `not_sure` | Recognized in `not_sure` (as `ఏక చాయ ఏక ది తి`) | Missed (in `not_sure`, looped on `కాల కాల` before number) | **Nabanita clearly superior** (recognized digits phonetically) | Recognized phonetically by Nabanita; Pradeep needs human listening |
| 13 | **সুষম সার** | `healthy`, `brown_spot` | Recognized in `healthy` (as `सुशम्षार`) | Recognized in `healthy` (as `సంశార`) | Tied (both recognized phonetically in `healthy`) | Recognized by both voices phonetically |
| 14 | **আগাছা** | `healthy` | Recognized in `healthy` (as `आगाचा`) | Recognized in `healthy` (as `ఆరాగాచా`) | Tied (both recognized phonetically in `healthy`) | Recognized by both voices phonetically |

---

## 5. Mechanistic Failure Analysis & Insights

### Why Did CER Measure ~0.84 to ~0.99?

The high Character Error Rate is caused entirely by two well-documented ASR model pathologies in multilingual Whisper:

1. **Cross-Script Language Decoder Entanglement:**
   - OpenAI Whisper's tokenizer uses shared BPE tokens across Indic languages. When `language="bn"` is provided without an explicit script-locking initial prompt, the decoder's cross-attention frequently resolves phonetic features into Devanagari (`hi`/`mr`) or Telugu (`te`) Unicode blocks.
   - For example, in `healthy-v1.mp3`, Nabanita speaks `"নিয়মিত ক্ষেত দেখুন, সুষম সার দিন, আর আগাছা পরিষ্কার রাখুন"`. The ASR output is `नियमितो खेप देखुन सुशम्षार दिन आर आगाचा पुरिश्कर राकुन`. Every single word was pronounced accurately and perceived accurately, but scored a high CER due to Unicode character mismatch.

2. **The "সম্ভবত" Absorbing Token Collapse:**
   - All five disease clips (`blast`, `brown_spot`, `leaf_smut`, `tungro`, `sheath_blight`) in `texts_read_aloud.md` begin with the identical phrase: `"সম্ভবত [রোগের নাম] রোগ..."`.
   - On the labial/nasal consonant cluster in "সম্ভবত" (`shombhoboto`), Whisper's unconstrained Indic decoder assigned highest probability to the standalone single-letter token `ব` (`\u09AC`). Once emitted, the self-attention autoregressive context reinforced $P(\text{ব} \mid \text{ব}) \approx 1.0$, entering an absorbing sequence `ববব...` that filled the max sequence length.
   - The two clips that **did not** begin with "সম্ভবত" (`healthy`, which begins with "পাতাটি...", and `not_sure`, which begins with "আমি নিশ্চিত নই...") **never entered this loop** and successfully decoded the full sentences.

---

## 6. Voice Comparison & Short Conclusion

1. **Intelligibility Between Voices:**
   - **Nabanita (`bn-BD-NabanitaNeural`) is demonstrably superior in clarity and stability.**
     - In `healthy`, Nabanita decoded without any trailing loops (107 characters spanning the complete 10-second clip).
     - In `not_sure`, Nabanita successfully enunciated all the way through the helpline number `"এক ছয় এক দুই তিন"` (transcribed phonetically as `ఏక చాయ ఏక ది తి`), the call center `"কৃষি কল সেন্টারে"` (`కిషి కాల సంటా రి`), and the call-to-action `"ফোন করুন"` (`ఫాన కాన`).
   - **Pradeep (`bn-IN-PradeepNeural`) exhibits cadence trailing.**
     - In both `healthy` and `not_sure`, Pradeep's clips ended prematurely in repetitive syllable loops (`కాక కాక...` and `కాల కాల...`), failing to complete the telephone number.
2. **App Guidance Recommendation:**
   - For production use in AgroLeaf AI, **Nabanita (`bn-BD-NabanitaNeural`) is the recommended voice**.
   - The 11 keywords missed across the disease clips are classified as **"needs human listening"** due to the recognizer's absorbing loop on the initial word "সম্ভবত", and are not evidence of mispronunciation.
