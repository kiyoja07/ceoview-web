import { formatDateDisplay } from "@/app/lib/formatters";
import type { AgentUserItem } from "@/types/agent/users";

type UserTableProps = {
  users: AgentUserItem[];
  currentUserId: string;
  canManageUsers: boolean;
  summary: { total: number; active: number; masters: number };
  submittingKey: string | null;
  onToggleActive: (userId: string, nextIsActive: boolean) => void;
};

export function UserTable({
  users,
  currentUserId,
  canManageUsers,
  summary,
  submittingKey,
  onToggleActive,
}: UserTableProps) {
  return (
    <section className="mb-8 rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
      <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">소속 사용자</h2>
        <p className="text-xs text-gray-500">
          총 {summary.total}명 / 활성 {summary.active} / 마스터{" "}
          {summary.masters}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                이름/이메일
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                권한
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                가입일
              </th>
              {canManageUsers && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                  작업
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const disabled = submittingKey === user.id;
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className={isSelf ? "bg-blue-50/40" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {user.name}
                      {isSelf && (
                        <span className="ml-1.5 text-[10px] font-medium text-blue-600">
                          (나)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.isMaster
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.isMaster ? "MASTER" : "MEMBER"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {user.isActive ? "활성" : "탈퇴"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDateDisplay(user.createdAt)}
                  </td>
                  {canManageUsers && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={disabled || isSelf}
                        onClick={() => onToggleActive(user.id, !user.isActive)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          !user.isActive || isSelf
                            ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {user.isActive ? "탈퇴 처리" : "복구"}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
