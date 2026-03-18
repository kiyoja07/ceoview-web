import {
  getPayslipChannelLabel,
  type PayslipSendChannel,
} from "@/app/lib/payslip-delivery";

interface PayslipChannelSelectorProps {
  availableChannels: PayslipSendChannel[];
  selectedChannels: PayslipSendChannel[];
  onToggle: (channel: PayslipSendChannel) => void;
  detailsByChannel?: Partial<Record<PayslipSendChannel, string>>;
}

export function PayslipChannelSelector({
  availableChannels,
  selectedChannels,
  onToggle,
  detailsByChannel,
}: PayslipChannelSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500">발송 채널</p>
      <div className="space-y-2">
        {availableChannels.map((channel) => {
          const selected = selectedChannels.includes(channel);
          const detail = detailsByChannel?.[channel];

          return (
            <button
              key={channel}
              type="button"
              onClick={() => onToggle(channel)}
              className={`flex w-full items-start justify-between rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getPayslipChannelLabel(channel)}
                </p>
                {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
              </div>
              <span
                className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  selected
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 text-transparent"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
