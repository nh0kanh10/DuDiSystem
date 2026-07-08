import LeaveRequestPanel from "../nghi-phep/LeaveRequestPanel"
import type { Employee } from "../../types"

interface Props {
  employee: Employee
}

export default function UserTimeOff({ employee }: Props) {
  return <LeaveRequestPanel employee={employee} />
}
