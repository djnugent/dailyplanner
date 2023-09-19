import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline"
import { Recurring } from "@/lib/types"

const recurringMap = {
    once: '',
    daily: 'D',
    weekly: 'W',
    monthly: 'M',
    yearly: 'Y',
    perpetual: 'ꝏ',
}

export function RecurringIcon({ recurring }: { recurring: Recurring }) {

    if (!recurring || recurring === 'once') return <div className="w-6 h-6"></div>

    const recurringText = recurringMap[recurring]

    return (
        <div className="relative h-6 w-6 text-gray-400">
            <ArrowPathRoundedSquareIcon className="w-6 h-6" />
            <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-[0.6rem] font-semibold">
                {recurringText}
            </p>
        </div >
    )
}