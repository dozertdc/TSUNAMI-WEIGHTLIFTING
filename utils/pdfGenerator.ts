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
  
  // Initialize workout totals at the start
  let workoutTotalSets = 0;
  let workoutTotalWeight = 0;
  let workoutTotalReps = 0;
  let workoutTotalTonnage = 0;
  let setCount = 0;

  // Iterate through each day in the date range
  for (let d = new Date(formattedStartDate); d <= formattedEndDate; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const dayData = workouts[dateKey];
    
    if (dayData && dayData.exercises.length > 0) {
      // Reset workout totals for each day
      workoutTotalSets = 0;
      workoutTotalWeight = 0;
      workoutTotalReps = 0;
      workoutTotalTonnage = 0;
      setCount = 0;

      // Add date header with proper formatting
      doc.setFontSize(14);
      const displayDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
      doc.text(formatDate(displayDate), 14, yPosition);
      yPosition += 10;

      // Add exercises
      dayData.exercises.forEach((exercise: Exercise) => {
        // Update workout total sets first
        workoutTotalSets += exercise.sets.length;

        // Create table for sets
        const tableData = exercise.sets.map((set, index) => {
          if (exercise.isComplex && exercise.complexParts) {
            // Handle complex exercises
            const partReps = exercise.complexParts.map((part, i) => set[`exercise${i}Reps`] || 0);
            const totalReps = partReps.reduce((sum, reps) => sum + reps, 0);
            const repsDisplay = `(${partReps.join('+')}) ${totalReps}`;
            const totalTonnage = set.weight * totalReps;

            return [
              index + 1,
              set.weight,
              repsDisplay,
              Math.round(totalTonnage)
            ];
          } else {
            // Handle regular exercises
            const setTonnage = set.weight * (set.reps || 0);
            return [
              index + 1,
              set.weight,
              set.reps || 0,
              Math.round(setTonnage)
            ];
          }
        });

        // Create headers based on exercise type
        const headers = exercise.isComplex && exercise.complexParts
          ? [
              [{ 
                content: exercise.name, 
                colSpan: 4, 
                styles: { halign: 'center', fillColor: [40, 40, 40] } 
              }],
              ['Set', 'Weight (kg)', 'Reps', 'Tonnage (kg)']
            ]
          : [
              [{ 
                content: exercise.name, 
                colSpan: 4, 
                styles: { halign: 'center', fillColor: [40, 40, 40] } 
              }],
              ['Set', 'Weight (kg)', 'Reps', 'Tonnage (kg)']
            ];

        // Calculate summary row data
        if (exercise.isComplex && exercise.complexParts) {
          const totalSets = exercise.sets.length;
          const avgWeight = exercise.sets.reduce((sum, set) => sum + set.weight, 0) / totalSets;
          
          // Calculate totals for each part and total reps
          const partTotals = exercise.complexParts.map((_, partIndex) => 
            exercise.sets.reduce((sum, set) => sum + (set[`exercise${partIndex}Reps`] || 0), 0)
          );
          const totalReps = partTotals.reduce((sum, reps) => sum + reps, 0);
          const repsDisplay = `(${partTotals.join('+')}) ${totalReps}`;
          
          // Calculate total tonnage
          const totalTonnage = exercise.sets.reduce((sum, set) => {
            const setTotalReps = exercise.complexParts!.reduce((reps, _, i) => 
              reps + (set[`exercise${i}Reps`] || 0), 0);
            return sum + (set.weight * setTotalReps);
          }, 0);

          tableData.push([
            `Total: ${totalSets}`,
            `Avg: ${Math.round(avgWeight)}`,
            `Total: ${repsDisplay}`,
            `Total: ${Math.round(totalTonnage)}`
          ]);
        } else {
          // Keep existing regular exercise summary calculation
          const totalSets = exercise.sets.length;
          const avgWeight = exercise.sets.reduce((sum, set) => sum + set.weight, 0) / totalSets;
          const totalReps = exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0);
          const totalTonnage = exercise.sets.reduce((sum, set) => sum + (set.weight * (set.reps || 0)), 0);
          
          tableData.push([
            `Total: ${totalSets}`,
            `Avg: ${Math.round(avgWeight)}`,
            `Total: ${totalReps}`,
            `Total: ${Math.round(totalTonnage)}`
          ]);
        }

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

        // Update workout totals for complex exercises
        if (exercise.isComplex && exercise.complexParts) {
          exercise.sets.forEach(set => {
            workoutTotalWeight += set.weight;
            setCount++;
            const totalReps = exercise.complexParts!.reduce((sum, _, i) => 
              sum + (set[`exercise${i}Reps`] || 0), 0);
            workoutTotalReps += totalReps;
            workoutTotalTonnage += set.weight * totalReps;
          });
        } else {
          // Update workout totals for regular exercises
          exercise.sets.forEach(set => {
            workoutTotalWeight += set.weight;
            setCount++;
            workoutTotalReps += set.reps || 0;
            workoutTotalTonnage += set.weight * (set.reps || 0);
          });
        }

        yPosition = (doc as any).lastAutoTable.finalY;
      });

      // Add workout summary
      const avgWeight = setCount > 0 ? Math.round(workoutTotalWeight / setCount) : 0;

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