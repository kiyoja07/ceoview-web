type DashboardPageStateProps = {
  message: string;
};

export function DashboardPageState({ message }: DashboardPageStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}
