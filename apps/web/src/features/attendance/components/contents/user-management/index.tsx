import { ContentContainer } from "@/components/containers/content-container";
import { DataTable } from "@/components/containers/data-table";
import {
  ProfileConfigProvider,
  useProfileConfig,
} from "@/features/attendance/provider/profile-config.provider";
import { useUserManagementColumns } from "./table/columns";
import { UserManagementAddDialog } from "./dialogs/add";
import { UserManagementEditDialog } from "./dialogs/edit";

export function AttendanceUserManagement() {
  return (
    <ProfileConfigProvider>
      <InnerTemplate />
    </ProfileConfigProvider>
  );
}

const InnerTemplate = () => {
  const { data } = useProfileConfig();
  const columns = useUserManagementColumns();

  return (
    <>
      <ContentContainer title="Manajemen User" description="Manajemen User">
        <DataTable
          columns={columns}
          data={data ?? []}
          enableFiltering={true}
          enableSorting={true}
        />
      </ContentContainer>

      <UserManagementAddDialog />
      <UserManagementEditDialog />
    </>
  );
};
