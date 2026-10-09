INSERT INTO "push_subject" (
	"identifier",
	"name",
	"subscriptionId",
	"userId"
)
SELECT
	'lostfound_post'::"push_subject_identifier_enum",
	'분실물 찾기 알림',
	subscription."id",
	subscription."userId"
FROM "push_subscription" AS subscription
WHERE NOT EXISTS (
	SELECT 1
	FROM "push_subject" AS subject
	WHERE subject."subscriptionId" = subscription."id"
		AND subject."identifier" = 'lostfound_post'::"push_subject_identifier_enum"
);
