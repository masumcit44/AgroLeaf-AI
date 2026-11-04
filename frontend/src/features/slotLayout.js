// Where each feature appears (order = order on screen). Owned by the lead.
import * as pwa from './pwa/index.jsx';
import * as reliability from './reliability/index.jsx';
import * as history from './history/index.jsx';
import * as profile from './profile/index.jsx';
import * as weather from './weather/index.jsx';
import * as actionPlan from './actionPlan/index.jsx';
import * as feedback from './feedback/index.jsx';
import * as help from './help/index.jsx';
import * as areaMap from './areaMap/index.jsx';
import * as reminders from './reminders/index.jsx';
import * as yieldRisk from './yieldRisk/index.jsx';
import WeatherPage from './weather/WeatherPage.jsx';

export const SLOT_LAYOUT = {
  app: [['pwa', pwa.PwaStatus]],
  home: [
    ['pwa', pwa.InstallPrompt],
    ['reminders', reminders.DueRemindersBanner],
    ['history', history.HistoryLink],
  ],
  result: [
    ['reliability', reliability.ReliabilityNote],
    ['actionPlan', actionPlan.ActionPlan],
    ['reminders', reminders.FollowUpReminder],
    ['yieldRisk', yieldRisk.YieldRiskCard],
    ['weather', weather.WeatherChips],
    ['history', history.SaveToHistory],
    ['feedback', feedback.FeedbackButton],
    ['help', help.HelpButton],
    ['areaMap', areaMap.AreaReportPrompt],
  ],
};

// Pages reachable only when their feature is on (otherwise the route shows the home page)
export const FEATURE_ROUTES = {
  '#/history': ['history', history.HistoryPage],
  '#/profile': ['profile', profile.ProfilePage],
  '#/weather': ['weather', WeatherPage],
  '#/map': ['areaMap', areaMap.MapPage],
  '#/reminders': ['reminders', reminders.RemindersPage],
};
