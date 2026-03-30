use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppDb {
    pub conn: Mutex<Connection>,
}

impl AppDb {
    pub fn new(app_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        fs::create_dir_all(&app_dir)?;
        let db_path = app_dir.join("rnd_lab.db");
        let conn = Connection::open(&db_path)?;

        // Enable WAL mode for better concurrent read performance
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        // Initialize schema
        let schema = include_str!("schema.sql");
        conn.execute_batch(schema)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}

pub fn seed_sample_data(db: &AppDb) -> Result<(), rusqlite::Error> {
    let conn = db.conn.lock().unwrap();

    // Only seed if projects table is empty
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM projects", [], |r| r.get(0))?;
    if count > 0 {
        return Ok(());
    }

    conn.execute_batch(
        "
        INSERT INTO projects (name, description, status) VALUES
            ('UV 경화 접착제 개발', '자외선 경화형 접착제 배합 최적화 프로젝트', 'active'),
            ('수성 잉크 개선', '점도 및 발색 개선을 위한 수성 잉크 리포뮬레이션', 'active'),
            ('슬라임 신제품', '아이용 안전 슬라임 신제품 개발', 'paused');

        INSERT INTO tasks (date, title, description, status, priority, project_id) VALUES
            ('2026-03-29', 'UV 접착제 점도 테스트', '배합비 A-3에 대한 점도 측정', 'todo', 'high', 1),
            ('2026-03-29', '주간 보고서 작성', '이번 주 실험 결과 정리', 'todo', 'medium', NULL),
            ('2026-03-30', '잉크 발색 비교 실험', '안료 농도별 발색 비교', 'todo', 'high', 2),
            ('2026-03-28', '시약 재고 확인', '에폭시 수지, 경화제 재고 점검', 'done', 'low', NULL);

        INSERT INTO experiments (project_id, date, title, batch_code, objective, observation_md, result_summary) VALUES
            (1, '2026-03-27', 'UV 접착제 배합 A-3', 'UV-A3-0327', '에폭시 아크릴레이트 비율 최적화',
             '## 관찰\n- 혼합 후 기포 다량 발생\n- 30분 탈포 후 안정화\n- UV 조사 후 경화 양호',
             '접착 강도 양호, 점도 약간 높음'),
            (2, '2026-03-26', '수성 잉크 점도 조절', 'INK-V2-0326', '증점제 농도에 따른 점도 변화 확인',
             '## 관찰\n- 0.5% 증점제: 점도 낮음\n- 1.0% 증점제: 적정\n- 1.5% 증점제: 과점도',
             '1.0% 증점제 농도가 최적');

        INSERT INTO formulation_entries (experiment_id, material_name, amount, unit, role) VALUES
            (1, '에폭시 아크릴레이트', 45.0, 'g', '주수지'),
            (1, '반응성 희석제 (HDDA)', 30.0, 'g', '희석제'),
            (1, '광개시제 (Irgacure 184)', 3.0, 'g', '광개시제'),
            (1, '실란 커플링제', 2.0, 'g', '접착 증진제'),
            (2, '수성 바인더', 50.0, 'g', '바인더'),
            (2, '카본블랙 안료', 10.0, 'g', '안료'),
            (2, '증점제 (HEC)', 1.0, 'g', '증점제'),
            (2, '정제수', 39.0, 'g', '용매');

        INSERT INTO process_conditions (experiment_id, temperature, mixing_time, mixing_speed, ph, aging_time, memo) VALUES
            (1, 25.0, 30.0, 500.0, NULL, 60.0, '진공 탈포 30분 포함'),
            (2, 25.0, 20.0, 300.0, 7.5, NULL, '저속 교반으로 기포 최소화');

        INSERT INTO property_measurements (experiment_id, property_name, value, unit, test_method, memo) VALUES
            (1, '점도', 3500.0, 'cP', 'Brookfield DV-II', '25°C, spindle #4'),
            (1, '접착 강도', 12.5, 'MPa', 'UTM 인장시험', '유리-유리 기판'),
            (1, '경화 시간', 30.0, 's', 'UV 램프 조사', '365nm, 100mW/cm²'),
            (2, '점도', 850.0, 'cP', 'Brookfield DV-II', '25°C, spindle #2'),
            (2, '발색 (L*)', 22.5, '', '분광광도계', 'CIE L*a*b*'),
            (2, 'pH', 7.5, '', 'pH 미터', '');

        INSERT INTO inventory_logs (item_name, log_type, sub_type, quantity, unit, date, purpose, project_id, experiment_id, memo,
            provider, usage_desc, unit_price, form_factor, total_amount, recipient_dept, recipient_name, lot, test_content, test_result) VALUES
            ('에폭시 아크릴레이트', 'IN', '원료 샘플(입고)', 500.0, 'g', '2026-03-24', '배합 원료', NULL, NULL, '', 'ABC Chemical', 'UV 접착제 배합용', NULL, NULL, NULL, '', '', '', '', ''),
            ('카본블랙 안료', 'IN', '원료 샘플(입고)', 500.0, 'g', '2026-03-25', '잉크 안료', NULL, NULL, '', 'XYZ Pigment', '수성 잉크 발색용', NULL, NULL, NULL, '', '', '', '', ''),
            ('UV 접착제 시작품 v3', 'IN', '자사 샘플(입고)', 10.0, 'ea', '2026-03-28', '시작품 입고', 1, NULL, '', '', '', 5000.0, 1.0, 50000.0, '', '', '', '', ''),
            ('A4용지', 'IN', '비품(입고)', 5.0, 'box', '2026-03-25', '사무용품', NULL, NULL, '', '', '', NULL, NULL, NULL, '', '', '', '', ''),
            ('K사 UV 접착제 RX-100', 'IN', '타사 샘플(입고)', 100.0, 'g', '2026-03-26', '벤치마크 분석', NULL, NULL, '경쟁사 제품', '', '', NULL, NULL, NULL, '', '', '', '', ''),
            ('에폭시 아크릴레이트', 'OUT', '시험 샘플(출고)', 45.0, 'g', '2026-03-27', '배합 A-3 실험', 1, 1, '', '', '', NULL, NULL, NULL, '', '', 'UV-A3-0327', '점도/접착강도 측정', '점도 3500cP, 접착강도 12.5MPa'),
            ('수성 바인더', 'OUT', '시험 샘플(출고)', 50.0, 'g', '2026-03-26', '잉크 점도 조절', 2, 2, '', '', '', NULL, NULL, NULL, '', '', 'INK-V2-0326', '점도/발색 측정', ''),
            ('UV 접착제 시작품 v3', 'OUT', '견본(출고)', 2.0, 'ea', '2026-03-29', '품질팀 평가용', 1, NULL, '', '', '', NULL, NULL, NULL, '품질관리팀', '김철수', '', '', '');
        "
    )?;

    Ok(())
}
