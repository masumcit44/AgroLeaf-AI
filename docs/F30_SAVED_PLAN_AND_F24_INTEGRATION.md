# F30: Saved Agricultural Plans & F24 Reminder Integration
**Document ID:** `docs/F30_SAVED_PLAN_AND_F24_INTEGRATION.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** Lead Software Architect & Mobile Storage Specialist  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** INTEGRATION SPECIFICATION  

---

## 1. Executive Summary

A personalized agricultural research roadmap has lasting value throughout a 110–160 day rice cultivation season. A farmer must be able to:
1. Save full research plans locally for offline reference.
2. Review, rename, or delete past plans.
3. Turn actionable roadmap milestones into scheduled reminders without leaving the copilot interface.

This document details the on-device persistence layer and the seamless integration with **F24 (Farmer Reminder & Crop Care Scheduler)**.

---

## 2. On-Device Storage Architecture (`plannerStore.js`)

Plans are stored on-device using IndexedDB, guaranteeing instant access without internet connectivity.

### 2.1 Database Schema Upgrade
The central database `src/lib/store/db.js` is upgraded from **Version 2 to Version 3**:

```javascript
// src/lib/store/db.js
export const DB_VERSION = 3;
export const STORES = {
  DEVICE: 'device',
  PROFILE: 'profile',
  HISTORY: 'history',
  OUTBOX: 'outbox',
  WEATHER: 'weather_cache',
  REMINDERS: 'reminders',
  PLANS: 'plans', // Added in Version 3
};

// Upgrade block
if (oldVersion < 3) {
  if (!db.objectStoreNames.contains(STORES.PLANS)) {
    const plans = db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
    plans.createIndex('created_at', 'created_at');
    plans.createIndex('variety_id', 'field_profile.variety_id');
    plans.createIndex('season', 'field_profile.season');
  }
}
```

### 2.2 CRUD Operations Matrix
| Operation | Function Signature | Description |
|---|---|---|
| **Create / Update** | `savePlan(plan: PersonalizedFarmingPlan): Promise<PersonalizedFarmingPlan>` | Validates schema, stamps `updated_at`, persists to IndexedDB |
| **Retrieve Single** | `getPlan(id: string): Promise<PersonalizedFarmingPlan \| null>` | Retrieves specific plan by UUID |
| **List All** | `listPlans(): Promise<PersonalizedFarmingPlan[]>` | Returns all saved plans sorted newest to oldest |
| **Delete** | `deletePlan(id: string): Promise<boolean>` | Deletes plan record (preserves existing scheduled reminders) |

---

## 3. Seamless Integration with F24 Reminders

AgroLeaf's F24 feature provides due-date tracking and notification infrastructure (`remindersStore.js`). The F30 Planner interfaces directly with this engine.

### 3.1 Task-to-Reminder Synchronization Workflow

```
[ Roadmap Task: "১ম কিস্তি ইউরিয়া ও আগাছা দমন" (Due: 2026-12-05) ]
                             │
            Tap: [ ⏰ স্মরণবার্তা চালু করুন ]
                             │
                             ▼
     Calls: remindersStore.saveReminder({
       id: newId(),
       title: "১ম কিস্তি ইউরিয়া ও আগাছা দমন",
       description: "জমিতে ছিপছিপে পানি রেখে আগাছা পরিষ্কার করে ১ম কিস্তি ইউরিয়া দিন।",
       due_date: "2026-12-05",
       due_time: "09:00",
       source: "crop_plan",
       disease_id: null
     })
                             │
                             ▼
     1. Plan task records: reminder_id = savedReminder.id
     2. Plan is updated in IndexedDB (plans store)
     3. Task UI toggles to: [ ✓ স্মরণবার্তা সক্রিয় ]
                             │
                             ▼
   [ On Due Date: Appears in F24 DueBanner on AgroLeaf Home Screen ]
```

### 3.2 Individual vs Bulk Scheduling
1. **Single Milestone Activation:** Each task row features an intuitive bell/clock icon button:
   - Inactive: `"⏰ স্মরণবার্তা চালু করুন"`
   - Active: `"✓ স্মরণবার্তা চালু আছে (বাতিল করতে চাপুন)"`
2. **One-Tap Bulk Scheduling ("সব আসন্ন কাজের স্মরণবার্তা চালু করুন"):**
   - A single prominent action button at the top of the roadmap card schedules reminders for all remaining future tasks in the growing season.
   - Confirmation toast displays: *"৩টি চাষাবাদ স্মরণবার্তা সফলভাবে যুক্ত হয়েছে।"*

---

## 4. Privacy & Zero-Cloud Leakage Guarantee

In strict accordance with AgroLeaf AI's core privacy charter:
- 100% of saved plans and reminder records remain inside the farmer's browser isolate.
- No farmer GPS locations, field sizes, or crop varieties are synchronized to central servers without explicit opt-in.
- Works reliably in remote village environments with zero mobile cellular coverage.
