import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchCampuses,
  fetchMajors,
  fetchClasses,
  fetchClassesFromDatabase,
  fetchCourses,
  fetchTeachers,
  type CampusProfile,
  type MajorProfile,
  type ClassProfile,
  type CourseProfile,
  type TeacherProfile,
} from '@/services/configMaster';

type Params = {
  campusName?: string;
  campusCode?: string;
  majorName?: string;
};

type Option<T> = { label: string; value: string; key: string | number; raw: T };
type State = {
  campuses: Option<CampusProfile>[];
  majors: Option<MajorProfile>[];
  classes: Option<ClassProfile>[];
  courses: Option<CourseProfile>[];
  teachers: Option<TeacherProfile>[];
  loading: boolean;
  error?: string;
};

const toOptions = <T,>(
  list: T[],
  map: (item: T) => { label: string; value: string; key?: string | number },
): Option<T>[] =>
  list.map((item) => {
    const base = map(item);
    return { ...base, key: base.key ?? base.value, raw: item };
  });

/**
 * 统一获取/缓存神殿、专业、班级、课程选项
 * - 传入 campusName/majorName 以过滤专业/班级/课程
 * - 内存缓存避免相同参数重复请求
 */
export const useConfigOptions = ({ campusName, campusCode, majorName }: Params): State => {
  const [state, setState] = useState<State>({
    campuses: [],
    majors: [],
    classes: [],
    courses: [],
    teachers: [],
    loading: false,
  });

  const cacheRef = useRef<Record<string, State>>({});
  const cacheKey = useMemo(
    () => `campus=${campusName || '__all__'}&major=${majorName || '__all__'}`,
    [campusName, majorName],
  );

  useEffect(() => {
    let abort = false;
    const cached = cacheRef.current[cacheKey];
    if (cached) setState({ ...cached, loading: false });

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
      try {
        const campusNameTrimmed = campusName?.trim();
        const campusRes = await fetchCampuses();
        const campusEntry = campusRes.find(
          (c) => c.name === campusNameTrimmed || c.code === campusNameTrimmed,
        );
        const resolvedCampusName = campusNameTrimmed || campusEntry?.name;
        const resolvedCampusCode = campusCode || campusEntry?.code;
        const majorsRes = await fetchMajors({
          campus_name: resolvedCampusName,
          campus_code: resolvedCampusCode,
        });
        const filteredMajors = majorsRes;
        const majorId = majorName ? majorsRes.find((m) => m.name === majorName)?.id : undefined;
        const [classesRes, classesFromDb, coursesRes, teachersRes] = await Promise.all([
          fetchClasses({ campus_name: resolvedCampusName, campus_code: resolvedCampusCode }),
          fetchClassesFromDatabase({ campus_name: resolvedCampusName }),
          fetchCourses({
            campus_name: resolvedCampusName,
            campus_code: resolvedCampusCode || undefined,
            major_id: majorId,
          }),
          fetchTeachers({ campus_name: resolvedCampusName, active: true }),
        ]);
        
        // 过滤配置中心的班级列表
        const filteredClasses = resolvedCampusCode || resolvedCampusName
          ? classesRes.filter(
              (c) =>
                (resolvedCampusCode && c.campus_code === resolvedCampusCode) ||
                (resolvedCampusName && c.campus_name === resolvedCampusName),
            )
          : classesRes;
        
        // 合并配置中心和数据库的班级列表
        // 创建配置中心班级名称的Set用于快速查找
        const configClassNames = new Set(filteredClasses.map(c => c.class_name));
        
        // 从数据库获取的班级名称中，找出不在配置中心的班级
        const dbOnlyClasses = classesFromDb.filter(className => !configClassNames.has(className));
        
        // 为数据库中的班级创建虚拟的ClassProfile对象
        const dbClassProfiles: ClassProfile[] = dbOnlyClasses.map((className, index) => ({
          id: -1000 - index, // 使用负数ID避免与配置中心的ID冲突
          class_name: className,
          campus_name: campusNameTrimmed || '',
          is_active: true,
        }));
        
        // 合并两个列表
        const mergedClasses = [...filteredClasses, ...dbClassProfiles];

        const next: State = {
          campuses: toOptions(campusRes, (c) => ({ label: c.name, value: c.name, key: c.code })),
          majors: toOptions(filteredMajors, (m) => ({ label: m.name, value: m.name, key: m.id })),
          classes: toOptions(mergedClasses, (c) => ({ label: c.class_name, value: c.class_name, key: c.id })),
          courses: toOptions(coursesRes, (c) => ({ label: c.course_name, value: c.course_name, key: c.id })),
          teachers: toOptions(teachersRes, (t) => ({ label: t.name, value: t.name, key: t.id })),
          loading: false,
        };

        cacheRef.current[cacheKey] = next;
        if (!abort) setState(next);
      } catch (error: unknown) {
        if (!abort) {
          const message = error instanceof Error ? error.message : '加载失败'
          setState((prev) => ({ ...prev, loading: false, error: message }));
        }
      }
    };

    load();
    return () => {
      abort = true;
    };
  }, [cacheKey, campusName, majorName]);

  return state;
};
