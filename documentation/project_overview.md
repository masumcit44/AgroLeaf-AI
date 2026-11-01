# Project overview

**Name:** AgroLeaf AI (the "Agro AI" prompt package uses the same project).

**User:** Bangladeshi rice farmers. Many have shared phones, weak signal and limited reading comfort.

**Problem:**
- Farmers can't easily identify rice leaf diseases.
- They often get advice from pesticide sellers.
- A wrong diagnosis means a wrong spray, wasted money and crop loss.

**Solution:** a web app with three steps:
1. Take or upload a photo of a rice leaf.
2. AI screening into 6 classes, with an honest "not sure".
3. A Bangla explanation and next steps, read aloud, with a one-tap 16123 call.

**AI:** a fine-tuned CNN (MobileNetV3 or EfficientNet-B0) trained on 9,769 Bangladeshi field photos. It is calibrated and tested on photos from other districts, and runs in the browser.

**Not in scope now:** accounts, chatbot, weather, other crops, marketplace.
