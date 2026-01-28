import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContributionCalendarProps {
  contributions: Record<string, number>;
}

export const ContributionCalendar: React.FC<ContributionCalendarProps> = ({
  contributions,
}) => {
  // Generate calendar data for the last 365 days
  const calendarData = useMemo(() => {
    const days: Array<{ date: Date; count: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Calculate start date (364 days ago to get 365 days including today)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setHours(0, 0, 0, 0);
    
    // Find the Sunday of the week containing startDate (GitHub style)
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const calendarStartDate = new Date(startDate);
    calendarStartDate.setDate(calendarStartDate.getDate() - startDayOfWeek);
    
    // Generate exactly 371 days (53 weeks * 7 days) starting from Sunday
    // This ensures we have complete weeks for display
    for (let i = 0; i < 371; i++) {
      const date = new Date(calendarStartDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      // Format date as YYYY-MM-DD to match API response
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      
      // Only count contributions for dates within our range (startDate to today)
      // Days before startDate will have count = 0 but still be displayed (for complete weeks)
      const count = (date >= startDate && date <= today) 
        ? (contributions[dateStr] || 0)
        : 0;
      
      days.push({
        date,
        count,
      });
    }
    
    return days;
  }, [contributions]);

  // Group days by week (Sunday to Saturday)
  const weeks = useMemo(() => {
    const weekGroups: Array<Array<{ date: Date; count: number } | null>> = [];
    
    // Group into weeks of 7 days
    for (let i = 0; i < calendarData.length; i += 7) {
      const weekSlice = calendarData.slice(i, i + 7);
      const week: Array<{ date: Date; count: number } | null> = [...weekSlice];
      // Ensure week has 7 days, pad with null if needed
      while (week.length < 7) {
        week.push(null);
      }
      weekGroups.push(week);
    }
    
    return weekGroups;
  }, [calendarData]);

  // Get intensity color based on count
  const getIntensityColor = (count: number): string => {
    if (count === 0) return "bg-[#161b22] border border-[#30363d]";
    if (count === 1) return "bg-[#0e4429]";
    if (count === 2) return "bg-[#006d32]";
    if (count === 3) return "bg-[#26a641]";
    return "bg-[#39d353]";
  };

  // Get month labels
  const monthLabels = useMemo(() => {
    const months: Array<{ month: string; weekIndex: number }> = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Calculate start date to filter out days before it
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setHours(0, 0, 0, 0);
    
    let lastMonth = -1;
    let lastYear = -1;
    weeks.forEach((week, weekIndex) => {
      // Find first valid day in week (within our date range)
      const firstValidDay = week.find((day) => {
        if (day === null) return false;
        return day.date >= startDate;
      });
      
      if (firstValidDay) {
        const month = firstValidDay.date.getMonth();
        const year = firstValidDay.date.getFullYear();
        
        // Only show label if it's the first week of the month or first week overall
        // Also check year to handle year transitions
        if ((month !== lastMonth || year !== lastYear) || weekIndex === 0) {
          months.push({
            month: monthNames[month],
            weekIndex: weekIndex,
          });
          lastMonth = month;
          lastYear = year;
        }
      }
    });
    
    return months;
  }, [weeks]);

  // Format date for tooltip
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            <div className="flex mb-2 ml-[30px]">
              {monthLabels.map((item, index) => {
                const weekIndexNum: number = item.weekIndex;
                const prevWeekIndex = index > 0 ? monthLabels[index - 1].weekIndex : 0;
                const gapBetweenWeeks = weekIndexNum - prevWeekIndex;
                const marginLeftPx = index === 0 ? 0 : gapBetweenWeeks * 17;
                
                return (
                  <div
                    key={`${item.month}-${weekIndexNum}`}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft: `${marginLeftPx}px`,
                      width: "17px",
                    }}
                  >
                    {item.month}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-2 flex-shrink-0">
                <div className="text-xs text-muted-foreground h-4"></div>
                <div className="text-xs text-muted-foreground h-4">Mon</div>
                <div className="text-xs text-muted-foreground h-4"></div>
                <div className="text-xs text-muted-foreground h-4">Wed</div>
                <div className="text-xs text-muted-foreground h-4"></div>
                <div className="text-xs text-muted-foreground h-4">Fri</div>
                <div className="text-xs text-muted-foreground h-4"></div>
              </div>

              {/* Calendar grid */}
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1 flex-shrink-0">
                    {week.map((day, dayIndex) => {
                      if (day === null) {
                        return (
                          <div key={`${weekIndex}-${dayIndex}`} className="w-4 h-4" />
                        );
                      }
                      
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`w-4 h-4 rounded ${getIntensityColor(day.count)} cursor-pointer hover:ring-2 hover:ring-border transition-all`}
                          title={`${day.count} ${day.count === 1 ? "commit" : "commits"} on ${formatDate(day.date)}`}
                        />
                      );
                    })}
                    {/* Fill empty days at end of week to make it 7 days */}
                    {week.length < 7 && (
                      <>
                        {Array.from({ length: 7 - week.length }).map((_, i) => (
                          <div key={`empty-${i}`} className="w-4 h-4" />
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-[#161b22] border border-[#30363d]"></div>
                <div className="w-4 h-4 rounded bg-[#0e4429]"></div>
                <div className="w-4 h-4 rounded bg-[#006d32]"></div>
                <div className="w-4 h-4 rounded bg-[#26a641]"></div>
                <div className="w-4 h-4 rounded bg-[#39d353]"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};