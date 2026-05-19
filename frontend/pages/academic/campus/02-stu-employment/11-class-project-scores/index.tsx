import React, { Suspense } from 'react'

const ProjectGradeRegisterPage = React.lazy(() => import('./3-project-grade-register'))

const ClassProjectScoresPage: React.FC = () => (
	<Suspense fallback={null}>
		<ProjectGradeRegisterPage />
	</Suspense>
)

export default ClassProjectScoresPage
