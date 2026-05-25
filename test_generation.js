async function test() {
  const API_URL = 'https://8f6e7e2bc5faf164-106-222-248-18.serveousercontent.com/api';
  console.log('Testing creation of assignment...');

  const assignmentData = {
    title: 'Test Physics Quiz',
    subject: 'Physics',
    grade: 'Grade 10',
    dueDate: '2026-06-30T00:00:00.000Z',
    questionTypes: ['mcq', 'true_false'],
    numberOfQuestions: 4,
    marksPerQuestion: 5,
    difficultyDistribution: {
      easy: 50,
      medium: 50,
      hard: 0
    },
    instructions: 'Please answer carefully.'
  };

  try {
    // 1. Create assignment
    const createRes = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'serveo-skip-browser-warning': 'true'
      },
      body: JSON.stringify(assignmentData)
    });

    if (!createRes.ok) {
      throw new Error(`Create failed with status ${createRes.status}`);
    }

    const createData = await createRes.json();
    const assignmentId = createData.data.assignment._id;
    console.log(`✅ Assignment created successfully! ID: ${assignmentId}`);

    // 2. Trigger generation
    console.log('Triggering question generation...');
    const genRes = await fetch(`${API_URL}/assignments/${assignmentId}/generate`, {
      method: 'POST',
      headers: {
        'serveo-skip-browser-warning': 'true'
      }
    });

    if (!genRes.ok) {
      throw new Error(`Generate failed with status ${genRes.status}`);
    }

    const genData = await genRes.json();
    console.log(`✅ Generation queued! Job ID: ${genData.data.jobId}`);

    // 3. Poll for status
    console.log('Polling for completion status (max 60 seconds)...');
    const start = Date.now();
    while (Date.now() - start < 60000) {
      const statusRes = await fetch(`${API_URL}/assignments/${assignmentId}`, {
        headers: {
          'serveo-skip-browser-warning': 'true'
        }
      });
      if (!statusRes.ok) {
        throw new Error(`Status check failed with status ${statusRes.status}`);
      }

      const statusData = await statusRes.json();
      const assignment = statusData.data;
      console.log(`Current status: ${assignment.status} (Progress: ${assignment.status === 'completed' ? '100%' : 'pending/queued/processing'})`);

      if (assignment.status === 'completed') {
        console.log('🎉 QUESTION GENERATION COMPLETED SUCCESSFULLY!');
        console.log(`Paper ID: ${assignment.generatedPaperId}`);
        
        // Fetch paper content
        const paperRes = await fetch(`${API_URL}/results/${assignment.generatedPaperId}`, {
          headers: {
            'serveo-skip-browser-warning': 'true'
          }
        });
        if (!paperRes.ok) {
          throw new Error(`Paper fetch failed with status ${paperRes.status}`);
        }

        const paperData = await paperRes.json();
        const paper = paperData.data?.paper;
        console.log('\n--- GENERATED PAPER DETAILS ---');
        console.log(`Title: ${paper?.title || 'No title'}`);
        console.log(`Total Marks: ${paper?.totalMarks || 'N/A'}`);
        console.log('Sections & Questions:');
        if (paper?.sections) {
          paper.sections.forEach(sec => {
            console.log(`\nSection: ${sec.title} (${sec.instruction})`);
            if (sec.questions) {
              sec.questions.forEach((q, i) => {
                console.log(`  ${i+1}. [${q.difficulty?.toUpperCase()} - ${q.marks} marks] ${q.question}`);
                if (q.options) {
                  console.log(`     Options: ${q.options.join(', ')}`);
                }
                if (q.answer) {
                  console.log(`     Answer: ${q.answer}`);
                }
              });
            }
          });
        } else {
          console.log('No sections or questions generated yet.', JSON.stringify(paper));
        }
        console.log('-------------------------------\n');
        process.exit(0);
      } else if (assignment.status === 'failed') {
        console.error('❌ QUESTION GENERATION FAILED!');
        console.error('Error Details:', assignment.error || 'Unknown error');
        process.exit(1);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.error('❌ Timeout reached! Polling exceeded 60 seconds.');
    process.exit(1);
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

test();
