export default {
  appName: "AgroLeaf AI",
  appSubtitle: "এগ্রোলিফ এআই",
  builtForAignite: "Built for Ostad Presents YUNet AIgnite Buildathon 2026",

  navHome: "Home",
  navAccuracy: "Accuracy",
  navAbout: "About",
  langSwitch: "বাংলা",

  homeHeadline: "Upload a rice leaf photo, find the likely disease",
  homeSubheadline: "Take a clear, focused photo of an affected leaf in good lighting",
  homeTakePhotoBtn: "📷 Take / Upload Photo",
  homeComingSoon: "Coming soon (Module 3)",

  // Photo Picker & Preview
  btnCamera: "Camera",
  btnGallery: "Gallery",
  btnCheck: "🔍 Check Leaf",
  btnRetake: "↺ Retake Photo",
  modelBeingAdded: "Model being added (Module 4)",
  analysingText: "Analyzing leaf...",
  analysingLeaf: "Checking the leaf photo…",
  modelLoadingProgress: "AI model getting ready…",
  demoModelBanner: "Demo model — not trained yet",
  // M06 Bangla Audio
  audioListen: "▶ Listen",
  audioPause: "⏸ Pause",
  audioReplay: "↺ Replay",
  audioAriaPlay: "Play audio explanation",
  audioAriaPause: "Pause audio explanation",
  audioAiVoice: "AI-generated voice",
  audioHumanVoice: "Recorded human voice",
  audioShowText: "Show voice script",
  audioHideText: "Hide voice script",

  // M05 Result and Content Cards
  possibleProblem: "Possible problem",
  healthyLeaf: "Healthy leaf",
  highConfidence: "High confidence",
  moderateConfidence: "Moderate confidence",
  sectionWhatIsThis: "What is this?",
  sectionSymptoms: "Symptoms",
  sectionWhatToDo: "What to do now",
  sectionPrevention: "Prevention",
  seeOfficialAdvice: "See official advice (BAMIS/DAE)",
  hideOfficialAdvice: "Hide official advice",
  officialSource: "Source",
  officialRetrieved: "Retrieved",
  officialWarning: "Confirm with your Upazila agriculture officer or call 16123 before using any chemical.",
  notSureTitle: "I'm not sure",
  notSurePossibly: "Possible conditions",
  callKrishiHelp: "📞 16123 Krishi Call Centre",
  callChargeNote: "Call charges may apply",
  btnRetakePhoto: "↺ Retake Photo",
  askOfficer: "Ask your Upazila agriculture officer or call 16123 before using any chemical.",
  btnTryAgain: "Try Again",
  btnTestAnother: "↺ Test Another Photo",
  resultTitle: "Screening Result",
  decisionConfident: "Likely condition identified",
  decisionNotSure: "Not sure / Inconclusive",
  inferenceTime: "Time: {ms} ms",
  previewTitle: "Review Leaf Photo",
  previewImageAria: "Captured rice leaf photo",
  hintNeverBlocks: "Note: This is an advisory hint only; you may still proceed with screening.",

  // Pictogram Tips
  tipOneLeaf: "One leaf",
  tipDaylight: "Daylight",
  tipCloseUp: "Close-up",

  // Quality Hints
  hintTooDark: "Photo looks somewhat dark. For clearest results, shoot in ample light.",
  hintTooBright: "Photo appears slightly blurry. Hold steady and focus directly on the leaf.",
  hintBlurry: "Photo appears slightly blurry. Hold steady and focus directly on the leaf.",

  // Error Messages
  errUnsupportedType: "Only image files (JPG, PNG, WebP) are supported",
  errTooLarge: "Image file exceeds the 10 MB limit",
  errDecodeFailed: "This image cannot be opened; please try another photo",
  errModelLoad: "Failed to load the AI model. Please check your internet connection.",
  errWasmUnsupported: "Your browser does not support WebAssembly. Please update Chrome or your browser.",

  footerDisclaimer: "This is a preliminary screening, not a final diagnosis. Ask your Upazila agriculture officer or call 16123 before using any chemical.",
  footerPrivacy: "The photo stays on your phone and is not sent anywhere",
  footerAboutLink: "About & Licences",

  accuracyTitle: "Model Accuracy & Transparency",
  evalInProgress: "Evaluation in progress",
  evalInProgressDesc: "Measured test results from Kaggle GPU training and external-district evaluation will appear here once runs are completed. No unverified or placeholder metrics are displayed.",

  aboutTitle: "About AgroLeaf AI",
  aboutDescription: "AgroLeaf AI is a mobile-first web app designed for Bangladeshi rice farmers. It uses on-device WebAssembly machine learning (MobileNetV3) to screen for foliar rice diseases entirely in the browser, functioning reliably even with slow or intermittent connectivity.",
  aboutKeyPointsTitle: "Key Principles",
  aboutKeyPoints: [
    "On-device Privacy: Photos never leave the farmer's smartphone.",
    "Calibrated 'Not Sure': When confidence is low or uncertain, the app abstains rather than making high-risk guesses.",
    "Extension Referral: Direct click-to-call link to the national agricultural helpline 16123.",
    "No AI Chemical Doses: Treatment advice strictly reflects official Bangladesh agricultural guidance."
  ],
  aboutCompetitionTitle: "Competition",
  aboutCompetition: "Ostad Presents YUNet AIgnite Buildathon 2026 (Solo Entry)",
  aboutDatasetTitle: "Dataset Credits & Content Licences",
  aboutDatasetCredit: "RiceLeafDiseaseBD v3 (Munna, M.M.H., Islam, T., Saha, S. et al., Mendeley Data, 1 Sep 2026, DOI: 10.17632/86s4jzj2m4.3), licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Disease guidance adapted from public extension sources (BAMIS/DAE)."
};
