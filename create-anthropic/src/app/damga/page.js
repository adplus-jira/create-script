import { ImprovedPage } from './component/improved-page';
import { generateManuscript } from './actions';

export default function DamgaPage() {
  return (
    <div className="relative bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✨ 개선된 원고 생성 시스템
          </h1>
          <p className="text-gray-600">
            하나씩 확인하며 생성하고, 피드백으로 조정하세요.
          </p>
        </div>
        <ImprovedPage generateManuscript={generateManuscript} />
      </div>
    </div>
  );
}
