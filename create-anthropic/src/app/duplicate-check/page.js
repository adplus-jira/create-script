import { DuplicateCheckPage } from './component/duplicate-check-page';
import { findDuplicates, applyTransforms } from './actions';

export default function DuplicateCheckPageRoute() {
  return (
    <div className="relative bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <DuplicateCheckPage findDuplicates={findDuplicates} applyTransforms={applyTransforms} />
      </div>
    </div>
  );
}

