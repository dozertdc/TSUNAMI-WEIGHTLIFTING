import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Exercise, Workouts } from '../types/workout';
import { formatDate } from './dateUtils';
import { calculateTonnage } from './tonnageUtils';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateWorkoutPDF = (workouts: Workouts, startDate: Date, endDate: Date) => {
  const doc = new jsPDF();
  
  // Add logo and title
  const logoUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wave-McwTzchM8YQSVkpgAADjaegFbYZ1oP.png";
  
  // Add logo as image
  doc.addImage(logoUrl, 'PNG', 14, 10, 20, 20); // x, y, width, height
  
  // Add Tsunami text next to logo
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Tsunami', 40, 25);
  
  // Add date range with proper timezone handling
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const formattedStartDate = new Date(startDate.getTime() + startDate.getTimezoneOffset() * 60000);
  const formattedEndDate = new Date(endDate.getTime() + endDate.getTimezoneOffset() * 60000);
//   doc.text(`${formatDate(formattedStartDate)} - ${formatDate(formattedEndDate)}`, 14, 40);

  let yPosition = 40; // Adjusted starting position to account for new header
  
  // Iterate through each day in the date range
  for (let d = new Date(formattedStartDate); d <= formattedEndDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const dayData = workouts[dateKey];
    
    if (dayData && dayData.exercises.length > 0) {
      // Add date header with proper formatting
      doc.setFontSize(14);
      const displayDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      doc.text(formatDate(displayDate), 14, yPosition);
      yPosition += 10;

      // Add exercises
      dayData.exercises.forEach((exercise: Exercise) => {
        // Create table for sets
        const tableData = exercise.sets.map((set, index) => {
          if (exercise.name === 'Clean and Jerk') {
            const cleanTonnage = set.weight * (set.cleans || 0);
            const jerkTonnage = set.weight * (set.jerks || 0);
            const totalTonnage = cleanTonnage + jerkTonnage;
            return [
              index + 1,
              set.weight,
              set.cleans || 0,
              set.jerks || 0,
              Math.round(totalTonnage)
            ];
          }
          const setTonnage = set.weight * set.reps;
          return [
            index + 1,
            set.weight,
            set.reps,
            Math.round(setTonnage)
          ];
        });

        // Calculate summary row data
        if (exercise.name === 'Clean and Jerk') {
          const totalSets = exercise.sets.length;
          const avgWeight = exercise.sets.reduce((sum, set) => sum + set.weight, 0) / totalSets;
          const totalCleans = exercise.sets.reduce((sum, set) => sum + (set.cleans || 0), 0);
          const totalJerks = exercise.sets.reduce((sum, set) => sum + (set.jerks || 0), 0);
          const totalTonnage = exercise.sets.reduce((sum, set) => 
            sum + (set.weight * (set.cleans || 0)) + (set.weight * (set.jerks || 0)), 0);
          
          tableData.push([
            `Total: ${totalSets}`,
            `Avg: ${Math.round(avgWeight)}`,
            `Total: ${totalCleans}`,
            `Total: ${totalJerks}`,
            `Total: ${Math.round(totalTonnage)}`
          ]);
        } else {
          const totalSets = exercise.sets.length;
          const avgWeight = exercise.sets.reduce((sum, set) => sum + set.weight, 0) / totalSets;
          const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
          const totalTonnage = exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
          
          tableData.push([
            `Total: ${totalSets}`,
            `Avg: ${Math.round(avgWeight)}`,
            `Total: ${totalReps}`,
            `Total: ${Math.round(totalTonnage)}`
          ]);
        }

        const headers = exercise.name === 'Clean and Jerk' 
          ? [
              [{ content: exercise.name, colSpan: 5, styles: { halign: 'center', fillColor: [40, 40, 40] } }],
              ['Set', 'Weight (kg)', 'Cleans', 'Jerks', 'Tonnage (kg)']
            ]
          : [
              [{ content: exercise.name, colSpan: 4, styles: { halign: 'center', fillColor: [40, 40, 40] } }],
              ['Set', 'Weight (kg)', 'Reps', 'Tonnage (kg)']
            ];

        doc.autoTable({
          head: headers,
          body: tableData,
          startY: yPosition,
          margin: { left: 20 },
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 66, 66] },
          createdRow: function(row, data, index) {
            if (index === tableData.length - 1) {
              row.cells.forEach(cell => {
                cell.styles.fillColor = [200, 200, 200];
                cell.styles.textColor = [0, 0, 0];
                cell.styles.fontStyle = 'bold';
              });
            }
          }
        });

        // Calculate exercise tonnage
        let tonnage = 0;
        if (exercise.name === 'Clean and Jerk') {
          exercise.sets.forEach(set => {
            tonnage += (set.weight * (set.cleans || 0)) + (set.weight * (set.jerks || 0));
          });
        } else {
          tonnage = exercise.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
        }

        yPosition = (doc as any).lastAutoTable.finalY;
      });

      // Calculate workout summary data
      let workoutTotalSets = 0;
      let workoutTotalWeight = 0;
      let workoutTotalReps = 0;
      let workoutTotalTonnage = 0;
      let setCount = 0;

      dayData.exercises.forEach(exercise => {
        workoutTotalSets += exercise.sets.length;
        exercise.sets.forEach(set => {
          workoutTotalWeight += set.weight;
          setCount++;
          if (exercise.name === 'Clean and Jerk') {
            workoutTotalReps += (set.cleans || 0) + (set.jerks || 0);
            workoutTotalTonnage += (set.weight * (set.cleans || 0)) + (set.weight * (set.jerks || 0));
          } else {
            workoutTotalReps += set.reps;
            workoutTotalTonnage += set.weight * set.reps;
          }
        });
      });

      const avgWeight = Math.round(workoutTotalWeight / setCount);

      // Add workout summary table
      doc.autoTable({
        body: [[
          `Total Sets: ${workoutTotalSets}`,
          `Avg Weight: ${avgWeight} kg`,
          `Total Reps: ${workoutTotalReps}`,
          `Total Tonnage: ${Math.round(workoutTotalTonnage)} kg`
        ]],
        startY: yPosition,
        margin: { left: 20 },
        theme: 'grid',
        styles: { 
          fontSize: 10,
          cellPadding: 5,
          lineColor: [255, 255, 255],
          lineWidth: 0.1
        },
        bodyStyles: {
          fillColor: [40, 40, 40],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Add page if needed
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    }
  }

  // Save the PDF
  doc.save('workout-report.pdf');
}; 