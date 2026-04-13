import { ContentContainer } from "@/components/containers/content-container";
import { DataTable } from "@/components/containers/data-table";
import {
  ProfileConfigProvider,
  useProfileConfig,
} from "@/features/attendance/provider/profile-config.provider";
import { useUserManagementColumns } from "./table/columns";
import { Button } from "@/components/ui/button";
import { useQueryParams } from "@/hooks/use-query-params";
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

  const { set } = useQueryParams();
  return (
    <>
      <ContentContainer
        title="Manajemen User"
        description="Manajemen User"
        rightElement={
          <Button
            variant={"accent"}
            size={"sm"}
            onClick={() => set("action", "add")}
          >
            Tambah Data
          </Button>
        }
      >
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
