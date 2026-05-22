'use client';

import { Header } from '@/components/layout';
import { AssignmentForm } from '@/modules/assignments/AssignmentForm';

export default function NewAssignmentPage() {
  return (
    <>
      <Header title="Create Assignment" description="Set up your assignment parameters for AI generation." />
      <div className="p-6">
        <AssignmentForm />
      </div>
    </>
  );
}
