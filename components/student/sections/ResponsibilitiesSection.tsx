import React from 'react';
import type { Student } from '../../../types';
import { useData } from '../../../App';
import { toPersianDigits } from '../../common/formatters';
import Card from '../../common/Card';

const BadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;


const ResponsibilitiesSection: React.FC<{ student: Student }> = ({ student }) => {
    const { responsibilities, responsibilityAssignments } = useData();

    const myActiveAssignments = responsibilityAssignments
        .filter(a => {
            const todayStr = new Date().toLocaleDateString('fa-IR-u-nu-latn').replace(/\//g, '-');
            return a.studentId === student.id && a.startDate <= todayStr && a.endDate >= todayStr;
        })
        .map(a => {
            const resp = responsibilities.find(r => r.id === a.responsibilityId);
            return { ...a, responsibility: resp };
        })
        .filter(a => a.responsibility)
        .sort((a,b) => a.endDate.localeCompare(b.endDate));

    return (
        <Card title="مسئولیت‌های من" icon={<BadgeIcon />}>
            <div className="space-y-4">
                {myActiveAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myActiveAssignments.map(a => (
                            <div key={a.id} className="bg-white rounded-xl shadow-lg overflow-hidden border-l-8 transition-transform hover:-translate-y-1" style={{ borderColor: a.responsibility?.color || '#9ca3af' }}>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{a.responsibility?.name}</h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        از {toPersianDigits(a.startDate)} تا {toPersianDigits(a.endDate)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-12">در حال حاضر مسئولیتی برای شما تعریف نشده است.</p>
                )}
            </div>
        </Card>
    );
};

export default ResponsibilitiesSection;
