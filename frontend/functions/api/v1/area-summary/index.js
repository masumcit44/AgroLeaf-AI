// GET /api/v1/area-summary?class=<key>&weeks=2
// Public endpoint, no auth, Cache-Control: public, max-age=600
// Returns [{ district_code, reports }] counting DISTINCT device_hash in the last N ISO weeks
// Districts with fewer than 3 distinct devices return reports: null (shown as "too few reports")

export async function onRequestGet(context) {
  try {
    const classKey = context.env.CLASS;
    const weeks = parseInt(context.env.WEEKS) || 2;

    if (!classKey) {
      return json({ error: 'missing_class' }, 400);
    }

    // Validate class
    const allowedClasses = ['blast', 'brown_spot', 'sheath_blight', 'tungro', 'healthy'];
    if (!allowedClasses.includes(classKey)) {
      return json({ error: 'invalid_class' }, 400);
    }

    // Calculate the date range for the specified number of weeks
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Format dates as ISO weeks
    const formatWeek = (d) => {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      // Simple week calculation
      const jan1 = new Date(year, 0, 1);
      const days = Math.floor((d - jan1) / 86400000);
      const week = Math.ceil((days + jan1.getDay() + 1) / 7);
      return `${year}-W${week.toString().padStart(2, '0')}`;
    };

    const startWeek = formatWeek(startDate);
    const endWeek = formatWeek(endDate);

    // Query the database for distinct device counts per district
    // Using a simplified approach: count distinct device_hash per district_code per iso_week
    const results = await context.env.DB.prepare(`
      SELECT district_code, COUNT(DISTINCT device_hash) AS device_count
      FROM area_reports
      WHERE class = ?
      AND created_at >= ?
      GROUP BY district_code, iso_week
    `).bind(classKey, startDate.toISOString()).all();

    // Group by district_code, taking the max device_count across weeks
    const districtCounts = {};
    for (const row of results.results || []) {
      const dc = row.district_code;
      if (!districtCounts[dc]) {
        districtCounts[dc] = 0;
      }
      districtCounts[dc] = Math.max(districtCounts[dc], row.device_count);
    }

    // Build response: districts with < 3 distinct devices get reports: null
    const items = [];
    for (const [district_code, count] of Object.entries(districtCounts)) {
      items.push({
        district_code,
        reports: count >= 3 ? count : null,
      });
    }

    return json({ items, class: classKey, weeks });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}