import datetime
import html
import os


def get_runtime_secret(name, st_module):
    value = os.getenv(name)
    if value not in (None, ""):
        return value
    try:
        secret_value = st_module.secrets.get(name)
    except Exception:
        secret_value = None
    if secret_value not in (None, ""):
        return str(secret_value)
    return None


def fmt_dt(value):
    if not value:
        return "-"
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return "-"
        try:
            value = datetime.datetime.fromisoformat(value)
        except ValueError:
            return value[:16]
    if isinstance(value, datetime.datetime):
        return value.strftime("%d %b %Y, %I:%M %p")
    if isinstance(value, datetime.date):
        return value.strftime("%d %b %Y")
    return str(value)[:16]


def esc_html(value):
    return html.escape("" if value is None else str(value))


def safe_key(value):
    return "".join(ch if ch.isalnum() else "_" for ch in str(value))


def to_int_id(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def normalize_year_option(raw_value):
    if raw_value is None:
        return None
    if hasattr(raw_value, "year"):
        raw_value = raw_value.year
    y_str = str(raw_value).strip()
    if not y_str:
        return None
    if "-" in y_str:
        return y_str
    try:
        y_int = int(y_str[:4])
        return f"{y_int}-{str(y_int + 1)[2:]}"
    except (TypeError, ValueError):
        return y_str


def is_date_picker_field(column_name, data_type):
    col = (column_name or "").strip().lower()
    dtype = (data_type or "").strip().lower()

    if col in {"created_at", "updated_at"}:
        return False
    if col == "year_of_estimate":
        return False
    if dtype == "date":
        return True

    parts = col.split("_")
    if "date" in parts:
        return True
    if col.startswith("date_") or col.endswith("_date") or "_date_" in col:
        return True
    return False


def parse_date_for_input(value):
    if value in (None, ""):
        return None
    if isinstance(value, datetime.datetime):
        return value.date()
    if isinstance(value, datetime.date):
        return value

    text = str(value).strip()
    if not text:
        return None

    try:
        return datetime.date.fromisoformat(text[:10])
    except (TypeError, ValueError):
        pass

    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y"):
        try:
            return datetime.datetime.strptime(text, fmt).date()
        except (TypeError, ValueError):
            continue
    return None


def normalize_date_for_storage(value):
    if value in (None, ""):
        return None
    if isinstance(value, datetime.datetime):
        return value.date().isoformat()
    if isinstance(value, datetime.date):
        return value.isoformat()

    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.date.fromisoformat(text[:10]).isoformat()
    except (TypeError, ValueError):
        return text


def serialize_date_fields_as_text(form_data, columns):
    if not isinstance(form_data, dict):
        return form_data
    for col_info in columns:
        col_name = col_info.get("column_name")
        data_type = col_info.get("data_type")
        if col_name in form_data and is_date_picker_field(col_name, data_type):
            form_data[col_name] = normalize_date_for_storage(form_data.get(col_name))
    return form_data


class ContractDataService:
    def __init__(
        self,
        session_state,
        all_modules_getter,
        user_id_getter,
        get_user_master_submissions,
        get_user_draft_summaries,
        get_project_dpr,
        get_master_ids_with_table_data,
    ):
        self._session_state = session_state
        self._all_modules_getter = all_modules_getter
        self._user_id_getter = user_id_getter
        self._get_user_master_submissions = get_user_master_submissions
        self._get_user_draft_summaries = get_user_draft_summaries
        self._get_project_dpr = get_project_dpr
        self._get_master_ids_with_table_data = get_master_ids_with_table_data

    def _all_modules(self):
        return self._all_modules_getter() or {}

    def _user_id(self):
        return self._user_id_getter()

    def split_contract_submissions(self, submissions, module_key="contract_management"):
        records = list(submissions or [])
        if not records:
            return [], []

        module_tables = self._all_modules().get(module_key, [])
        if not module_tables:
            return records, []

        master_ids = []
        for rec in records:
            rec_id = to_int_id(rec.get("id"))
            if rec_id is not None:
                master_ids.append(rec_id)

        master_ids_with_data = self._get_master_ids_with_table_data(master_ids, module_tables)

        real_contracts = []
        placeholders = []
        for rec in records:
            rec_id = to_int_id(rec.get("id"))
            status = str(rec.get("status") or "").strip().upper()
            has_table_data = rec_id in master_ids_with_data if rec_id is not None else False
            if status == "DRAFT" and not has_table_data:
                placeholders.append(rec)
            else:
                real_contracts.append(rec)

        return real_contracts, placeholders

    def build_contract_project_catalog(self, prefill_project=None):
        created_projects_key = "created_projects_store"
        if created_projects_key not in self._session_state:
            self._session_state[created_projects_key] = []

        project_catalog = {}
        estimate_sets = {}

        for item in self._session_state.get(created_projects_key, []):
            pname = (item.get("project_name") or "").strip()
            if not pname:
                continue
            pkey = pname.lower()
            project_catalog[pkey] = {
                "project_name": pname,
                "created_at": item.get("created_at") or datetime.datetime.now().isoformat(),
                "estimate_count": int(item.get("estimate_count") or 0),
            }
            estimate_sets[pkey] = set()

        user_id = self._user_id()
        completed_projects = self._get_user_master_submissions(user_id, module="contract_management")
        draft_projects = [
            d for d in self._get_user_draft_summaries(user_id)
            if d.get("module") == "contract_management"
        ]

        for rec in completed_projects + draft_projects:
            pname = (rec.get("name_of_project") or "").strip()
            if not pname:
                continue

            pkey = pname.lower()
            rec_created = rec.get("created_at") or datetime.datetime.now().isoformat()
            if pkey not in project_catalog:
                project_catalog[pkey] = {
                    "project_name": pname,
                    "created_at": rec_created,
                    "estimate_count": 0,
                }
                estimate_sets[pkey] = set()
            elif str(rec_created) > str(project_catalog[pkey].get("created_at") or ""):
                project_catalog[pkey]["created_at"] = rec_created

            est_no = (rec.get("estimate_number") or "").strip()
            est_yr = rec.get("year_of_estimate")
            if est_no and est_yr:
                y_val = est_yr.year if hasattr(est_yr, "year") else est_yr
                estimate_sets[pkey].add((est_no.lower(), str(y_val)))

        if prefill_project:
            pkey = prefill_project.lower()
            if pkey not in project_catalog:
                project_catalog[pkey] = {
                    "project_name": prefill_project,
                    "created_at": datetime.datetime.now().isoformat(),
                    "estimate_count": 0,
                }
                estimate_sets[pkey] = set()

        merged_projects = []
        for pkey, pdata in project_catalog.items():
            pdata["estimate_count"] = len(estimate_sets.get(pkey, set()))
            merged_projects.append(pdata)

        merged_projects.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        self._session_state[created_projects_key] = merged_projects
        return merged_projects

    def get_project_estimate_groups(self, project_name):
        project_key = " ".join((project_name or "").split()).lower()
        if not project_key:
            return []

        user_id = self._user_id()
        completed = self._get_user_master_submissions(user_id, module="contract_management")
        drafts = [
            d for d in self._get_user_draft_summaries(user_id)
            if d.get("module") == "contract_management"
        ]
        all_records = completed + drafts
        real_contract_records, _ = self.split_contract_submissions(
            all_records,
            module_key="contract_management",
        )
        real_contract_ids = set()
        for rec in real_contract_records:
            rec_id = to_int_id(rec.get("id"))
            if rec_id is not None:
                real_contract_ids.add(rec_id)

        grouped = {}
        for rec in all_records:
            pname = " ".join((rec.get("name_of_project") or "").split()).lower()
            if pname != project_key:
                continue

            est_no = (rec.get("estimate_number") or "").strip()
            est_yr = rec.get("year_of_estimate")
            if not est_no or not est_yr:
                continue

            y_val = est_yr.year if hasattr(est_yr, "year") else est_yr
            grp_key = (est_no.lower(), str(y_val))
            if grp_key not in grouped:
                grouped[grp_key] = {
                    "estimate_number": est_no,
                    "year_of_estimate": est_yr,
                    "status": rec.get("status", "DRAFT"),
                    "latest_date": rec.get("created_at"),
                    "contract_count": 0,
                }
            else:
                existing = grouped[grp_key]
                if str(rec.get("created_at") or "") > str(existing.get("latest_date") or ""):
                    existing["latest_date"] = rec.get("created_at")
                if rec.get("status") == "COMPLETED":
                    existing["status"] = "COMPLETED"

            rec_id = to_int_id(rec.get("id"))
            if rec_id is not None and rec_id in real_contract_ids:
                grouped[grp_key]["contract_count"] = int(grouped[grp_key].get("contract_count") or 0) + 1

        results = list(grouped.values())
        results.sort(key=lambda x: str(x.get("latest_date") or ""), reverse=True)
        return results

    def get_contract_mini_dashboard_stats(self, project_catalog=None):
        user_id = self._user_id()
        completed_contracts_raw = self._get_user_master_submissions(user_id, module="contract_management")
        draft_contracts_raw = [
            d for d in self._get_user_draft_summaries(user_id)
            if d.get("module") == "contract_management"
        ]
        visible_contracts, _ = self.split_contract_submissions(
            completed_contracts_raw + draft_contracts_raw,
            module_key="contract_management",
        )
        completed_contracts = []
        draft_contracts = []
        for rec in visible_contracts:
            status = str(rec.get("status") or "").strip().upper()
            if status == "DRAFT":
                draft_contracts.append(rec)
            else:
                completed_contracts.append(rec)

        estimate_groups = {}

        def _add_estimate_record(rec, is_draft):
            est_no = (rec.get("estimate_number") or "").strip()
            est_yr = rec.get("year_of_estimate")
            if not est_no or not est_yr:
                return

            project_key = " ".join((rec.get("name_of_project") or "").split()).lower()
            y_val = est_yr.year if hasattr(est_yr, "year") else est_yr
            group_key = (project_key, est_no.lower(), str(y_val))
            group = estimate_groups.setdefault(
                group_key,
                {
                    "project_key": project_key,
                    "project_name": (rec.get("name_of_project") or "").strip(),
                    "estimate_number": est_no,
                    "year_of_estimate": str(y_val),
                    "has_completed": False,
                    "has_incomplete": False,
                    "latest_date": rec.get("created_at"),
                },
            )

            status = str(rec.get("status") or "").strip().upper()
            if is_draft or status == "DRAFT":
                group["has_incomplete"] = True
            else:
                group["has_completed"] = True
            if str(rec.get("created_at") or "") > str(group.get("latest_date") or ""):
                group["latest_date"] = rec.get("created_at")

        for rec in completed_contracts_raw:
            _add_estimate_record(rec, is_draft=False)
        for rec in draft_contracts_raw:
            _add_estimate_record(rec, is_draft=True)

        completed_estimates = sum(
            1 for grp in estimate_groups.values()
            if grp.get("has_completed") and not grp.get("has_incomplete")
        )
        incomplete_estimates = len(estimate_groups) - completed_estimates

        project_catalog = (
            project_catalog if project_catalog is not None
            else self.build_contract_project_catalog()
        )
        groups_by_project = {}
        for grp in estimate_groups.values():
            groups_by_project.setdefault(grp.get("project_key", ""), []).append(grp)

        completed_projects = 0
        incomplete_projects = 0
        for proj in project_catalog:
            project_key = " ".join((proj.get("project_name") or "").split()).lower()
            project_groups = groups_by_project.get(project_key, [])
            is_project_complete = bool(project_groups) and all(
                g.get("has_completed") and not g.get("has_incomplete")
                for g in project_groups
            )
            if is_project_complete:
                completed_projects += 1
            else:
                incomplete_projects += 1

        dpr_finished = "N"
        dpr_completed = 0
        dpr_incomplete = 0
        dpr_details = []
        if project_catalog:
            for proj in project_catalog:
                pname = (proj.get("project_name") or "").strip()
                if not pname:
                    continue
                project_dpr = self._get_project_dpr(
                    user_id,
                    pname,
                    module="contract_management",
                )
                has_dpr = bool(project_dpr)
                if has_dpr:
                    dpr_completed += 1
                else:
                    dpr_incomplete += 1
                dpr_details.append(
                    {
                        "Project Name": pname,
                        "DPR Status": "Y" if has_dpr else "N",
                        "Updated": fmt_dt(project_dpr.get("updated_at")) if has_dpr else "-",
                    }
                )
            dpr_finished = "Y" if dpr_incomplete == 0 and dpr_completed > 0 else "N"
        else:
            dpr_details = []

        estimate_details = []
        for grp in estimate_groups.values():
            status = (
                "Completed"
                if grp.get("has_completed") and not grp.get("has_incomplete")
                else "Incomplete"
            )
            estimate_details.append(
                {
                    "Project Name": grp.get("project_name") or "-",
                    "Estimate Number": grp.get("estimate_number") or "-",
                    "Year": grp.get("year_of_estimate") or "-",
                    "Status": status,
                    "Last Updated": fmt_dt(grp.get("latest_date")),
                }
            )
        estimate_details.sort(
            key=lambda x: str(x.get("Last Updated") or ""),
            reverse=True,
        )

        project_details = []
        for proj in project_catalog:
            pname = (proj.get("project_name") or "").strip()
            pkey = " ".join(pname.split()).lower()
            project_groups = groups_by_project.get(pkey, [])
            is_project_complete = bool(project_groups) and all(
                g.get("has_completed") and not g.get("has_incomplete")
                for g in project_groups
            )
            project_details.append(
                {
                    "Project Name": pname or "-",
                    "Status": "Completed" if is_project_complete else "Incomplete",
                    "Estimates": int(proj.get("estimate_count") or 0),
                }
            )
        project_details.sort(key=lambda x: x.get("Project Name") or "")

        contract_details = []
        for rec in completed_contracts + draft_contracts:
            est_yr = rec.get("year_of_estimate")
            y_val = est_yr.year if hasattr(est_yr, "year") else est_yr
            status = str(rec.get("status") or "").strip().upper()
            contract_details.append(
                {
                    "Project Name": (rec.get("name_of_project") or "-").strip() or "-",
                    "Estimate Number": (rec.get("estimate_number") or "-").strip() or "-",
                    "Year": str(y_val) if y_val not in (None, "") else "-",
                    "Status": "Completed" if status != "DRAFT" else "Incomplete",
                    "Last Updated": fmt_dt(rec.get("created_at")),
                }
            )
        contract_details.sort(
            key=lambda x: str(x.get("Last Updated") or ""),
            reverse=True,
        )

        return {
            "dpr_finished": dpr_finished,
            "dpr_completed": dpr_completed,
            "dpr_incomplete": dpr_incomplete,
            "estimates_completed": completed_estimates,
            "estimates_incomplete": incomplete_estimates,
            "projects_completed": completed_projects,
            "projects_incomplete": incomplete_projects,
            "contracts_completed": len(completed_contracts),
            "contracts_incomplete": len(draft_contracts),
            "dpr_details": dpr_details,
            "estimate_details": estimate_details,
            "project_details": project_details,
            "contract_details": contract_details,
        }
