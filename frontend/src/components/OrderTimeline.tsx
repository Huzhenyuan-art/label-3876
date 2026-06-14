import React from 'react'
import { OrderTimelineItem } from '../types'

interface OrderTimelineProps {
    timeline: OrderTimelineItem[]
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ timeline }) => {
    return (
        <div className="space-y-8">
            {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-6 relative">
                    {idx !== timeline.length - 1 && (
                        <div className="absolute left-[7px] top-6 w-[2px] h-[calc(100%+8px)] bg-secondary-100" />
                    )}
                    <div className={`w-4 h-4 rounded-full mt-1.5 flex-shrink-0 z-10 border-2 ${item.active ? 'bg-primary border-primary shadow-lg shadow-primary/30' : 'bg-white border-secondary-200'}`} />
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-black italic tracking-tighter uppercase ${item.active ? 'text-primary' : 'text-secondary-900'}`}>{item.status}</span>
                            <span className="text-[10px] font-bold text-secondary-400">{item.time}</span>
                        </div>
                        <p className="text-xs font-bold text-secondary-500 leading-relaxed">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
