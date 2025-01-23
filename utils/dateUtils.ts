export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

export const getDaysInMonth = (date: Date): { date: Date; isCurrentMonth: boolean }[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  // Add previous month's days
  for (let i = 0; i < firstDay.getDay(); i++) {
    const prevDate = new Date(year, month, -i);
    days.unshift({
      date: prevDate,
      isCurrentMonth: false
    });
  }
  
  // Add current month's days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }
  
  return days;
};

