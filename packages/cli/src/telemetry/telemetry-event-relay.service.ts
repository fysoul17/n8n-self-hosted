import { Service } from 'typedi';
import { EventRelay } from '@/eventbus/event-relay.service';
import type { Event } from '@/eventbus/event.types';
import { Telemetry } from '.';
import config from '@/config';

@Service()
export class TelemetryEventRelay {
	constructor(
		private readonly eventRelay: EventRelay,
		private readonly telemetry: Telemetry,
	) {}

	async init() {
		if (!config.getEnv('diagnostics.enabled')) return;

		await this.telemetry.init();

		this.setupHandlers();
	}

	private setupHandlers() {
		this.eventRelay.on('team-project-updated', (event) => this.teamProjectUpdated(event));
		this.eventRelay.on('team-project-deleted', (event) => this.teamProjectDeleted(event));
		this.eventRelay.on('team-project-created', (event) => this.teamProjectCreated(event));
		this.eventRelay.on('source-control-settings-updated', (event) =>
			this.sourceControlSettingsUpdated(event),
		);
		this.eventRelay.on('source-control-user-started-pull-ui', (event) =>
			this.sourceControlUserStartedPullUi(event),
		);
		this.eventRelay.on('source-control-user-finished-pull-ui', (event) =>
			this.sourceControlUserFinishedPullUi(event),
		);
		this.eventRelay.on('source-control-user-pulled-api', (event) =>
			this.sourceControlUserPulledApi(event),
		);
		this.eventRelay.on('source-control-user-started-push-ui', (event) =>
			this.sourceControlUserStartedPushUi(event),
		);
		this.eventRelay.on('source-control-user-finished-push-ui', (event) =>
			this.sourceControlUserFinishedPushUi(event),
		);
	}

	private teamProjectUpdated({ userId, role, members, projectId }: Event['team-project-updated']) {
		void this.telemetry.track('Project settings updated', {
			user_id: userId,
			role,
			// eslint-disable-next-line @typescript-eslint/no-shadow
			members: members.map(({ userId: user_id, role }) => ({ user_id, role })),
			project_id: projectId,
		});
	}

	private teamProjectDeleted({
		userId,
		role,
		projectId,
		removalType,
		targetProjectId,
	}: Event['team-project-deleted']) {
		void this.telemetry.track('User deleted project', {
			user_id: userId,
			role,
			project_id: projectId,
			removal_type: removalType,
			target_project_id: targetProjectId,
		});
	}

	private teamProjectCreated({ userId, role }: Event['team-project-created']) {
		void this.telemetry.track('User created project', {
			user_id: userId,
			role,
		});
	}

	private sourceControlSettingsUpdated({
		branchName,
		readOnlyInstance,
		repoType,
		connected,
	}: Event['source-control-settings-updated']) {
		void this.telemetry.track('User updated source control settings', {
			branch_name: branchName,
			read_only_instance: readOnlyInstance,
			repo_type: repoType,
			connected,
		});
	}

	private sourceControlUserStartedPullUi({
		workflowUpdates,
		workflowConflicts,
		credConflicts,
	}: Event['source-control-user-started-pull-ui']) {
		void this.telemetry.track('User started pull via UI', {
			workflow_updates: workflowUpdates,
			workflow_conflicts: workflowConflicts,
			cred_conflicts: credConflicts,
		});
	}

	private sourceControlUserFinishedPullUi({
		workflowUpdates,
	}: Event['source-control-user-finished-pull-ui']) {
		void this.telemetry.track('User finished pull via UI', {
			workflow_updates: workflowUpdates,
		});
	}

	private sourceControlUserPulledApi({
		workflowUpdates,
		forced,
	}: Event['source-control-user-pulled-api']) {
		console.log('source-control-user-pulled-api', {
			workflow_updates: workflowUpdates,
			forced,
		});
		void this.telemetry.track('User pulled via API', {
			workflow_updates: workflowUpdates,
			forced,
		});
	}

	private sourceControlUserStartedPushUi({
		workflowsEligible,
		workflowsEligibleWithConflicts,
		credsEligible,
		credsEligibleWithConflicts,
		variablesEligible,
	}: Event['source-control-user-started-push-ui']) {
		void this.telemetry.track('User started push via UI', {
			workflows_eligible: workflowsEligible,
			workflows_eligible_with_conflicts: workflowsEligibleWithConflicts,
			creds_eligible: credsEligible,
			creds_eligible_with_conflicts: credsEligibleWithConflicts,
			variables_eligible: variablesEligible,
		});
	}

	private sourceControlUserFinishedPushUi({
		workflowsEligible,
		workflowsPushed,
		credsPushed,
		variablesPushed,
	}: Event['source-control-user-finished-push-ui']) {
		void this.telemetry.track('User finished push via UI', {
			workflows_eligible: workflowsEligible,
			workflows_pushed: workflowsPushed,
			creds_pushed: credsPushed,
			variables_pushed: variablesPushed,
		});
	}
}
