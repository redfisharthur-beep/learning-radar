"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateStudentProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const stage = String(formData.get("education_stage") ?? "");
  const grade = Number(formData.get("grade"));
  const schoolId = String(formData.get("school_id") ?? "").trim() || null;

  if (!displayName || displayName.length > 60) {
    redirect("/dashboard/profile?error=display-name");
  }
  if (
    !((stage === "elementary" && Number.isInteger(grade) && grade >= 1 && grade <= 6) ||
      (stage === "junior_high" && Number.isInteger(grade) && grade >= 7 && grade <= 9))
  ) {
    redirect("/dashboard/profile?error=grade");
  }

  if (schoolId) {
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_level")
      .eq("id", schoolId)
      .eq("is_active", true)
      .maybeSingle();

    if (schoolError || !school) redirect("/dashboard/profile?error=school");
    if (school.school_level !== "combined" && school.school_level !== stage) {
      redirect("/dashboard/profile?error=school-stage");
    }
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  if (profileError) redirect("/dashboard/profile?error=save");

  const { error: studentError } = await supabase
    .from("student_profiles")
    .upsert(
      {
        user_id: user.id,
        school_id: schoolId,
        education_stage: stage,
        grade,
      },
      { onConflict: "user_id" }
    );
  if (studentError) redirect("/dashboard/profile?error=save");

  redirect("/dashboard/profile?saved=1");
}

export async function saveStudentTextbookSelection(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const subjectId = String(formData.get("subject_id") ?? "");
  const editionId = String(formData.get("textbook_edition_id") ?? "");
  const academicYear = Number(formData.get("academic_year"));
  const semester = Number(formData.get("semester"));

  const allowedSubjects = ["chinese", "english", "math", "science", "social"];
  if (
    !allowedSubjects.includes(subjectId) ||
    !editionId ||
    !Number.isInteger(academicYear) ||
    academicYear < 100 ||
    ![1, 2].includes(semester)
  ) {
    redirect("/dashboard/textbooks?error=invalid");
  }

  const [{ data: student }, { data: edition }] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("education_stage, grade")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("textbook_editions")
      .select("id, subject_id, academic_year, education_stage, grade, volume_no")
      .eq("id", editionId)
      .eq("subject_id", subjectId)
      .eq("academic_year", academicYear)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (!student?.education_stage || !student.grade) {
    redirect("/dashboard/profile?error=complete-profile");
  }
  if (
    !edition ||
    edition.education_stage !== student.education_stage ||
    edition.grade !== student.grade ||
    edition.volume_no !== semester
  ) {
    redirect("/dashboard/textbooks?error=edition-mismatch");
  }

  const { error } = await supabase
    .from("student_textbook_selections")
    .upsert(
      {
        user_id: user.id,
        subject_id: subjectId,
        textbook_edition_id: editionId,
        academic_year: academicYear,
        semester,
      },
      { onConflict: "user_id,subject_id,academic_year,semester" }
    );

  if (error) redirect("/dashboard/textbooks?error=save");
  redirect("/dashboard/textbooks?saved=1");
}
