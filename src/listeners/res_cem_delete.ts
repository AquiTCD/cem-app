import { app } from '../initializers/bolt'
import { firestore } from '../initializers/firebase'
import { CallbackId, Message } from '../types/slack'

app.view(CallbackId.CemDelete, async ({ ack, body, view, context }) => {
  ack()

  const payload = (view.state as any).values
  const user = body.user.id
  const metadata = body.view.private_metadata
  const projectId = payload.project.projectId.selected_option.value

  const projectRef = firestore.collection(`projects`).doc(projectId)
  const project = await projectRef.get()
  const projData = project.data()
  const projectTitle = projData!.title
  // firestoreからプロジェクトとサブコレクションのチャレンジを削除
  const batch = firestore.batch()
  const challengesRef = await projectRef.collection(`challenges`).get()
  challengesRef.docs.forEach(challenge => {
    batch.delete(challenge.ref)
  })
  batch.delete(projectRef)
  await batch.commit()
  // 成功をSlack通知
  const msg: Message = {
    token: context.botToken,
    text: `新規プロジェクト[${projectTitle}]を削除しました`,
    channel: metadata,
    user: user,
  }
  await app.client.chat.postEphemeral(msg as any).catch(err => {
    throw new Error(err)
  })
})
