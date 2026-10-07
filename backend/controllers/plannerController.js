function generatePlan(subjects){

  const sorted = subjects.sort((a,b)=>{

    const daysA =
      new Date(a.deadline) - new Date();

    const daysB =
      new Date(b.deadline) - new Date();

    return daysA - daysB;
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const schedule = [];

  let i = 0;

  for(const subject of sorted){

    schedule.push({
      day: days[i % 7],
      task: `${subject.name} - ${subject.hours} hrs`
    });

    i++;
  }

  return schedule;
}

module.exports = generatePlan;