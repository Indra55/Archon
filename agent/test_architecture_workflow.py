import asyncio
import io
import json
import unittest
import zipfile
from unittest.mock import patch

from agent.pipelines import architecture_pipeline as pipeline
from agent.core.scaffold_archive import build_scaffold_archive


class ArchitectureWorkflowTests(unittest.IsolatedAsyncioTestCase):
    async def run_mode(self, mode):
        calls = []
        def node(name, result):
            async def execute(state):
                calls.append(name)
                return result
            return execute
        with patch.multiple(pipeline,
            analyze_requirements=node('analysis', {'project_name': 'tasks'}),
            design_architecture=node('design', {'services': [{'name': 'tasks-api'}]}),
            generate_blueprint=node('blueprint', {'blueprint_markdown': '# Tasks'}),
            scaffold_infrastructure=node('scaffold', {'scaffolded_files': [{'path': 'main.py', 'content': 'print(1)'}]}),
            create_pr=node('publish', {}),
        ):
            result = await pipeline.compile_architecture_pipeline(mode).ainvoke({'user_requirements': 'Build tasks', 'services': [{'name': 'existing-api'}], 'errors': []})
        return calls, result

    async def test_design_does_not_scaffold_or_publish(self):
        calls, result = await self.run_mode('design')
        self.assertEqual(calls, ['analysis', 'design', 'blueprint'])
        self.assertNotIn('scaffolded_files', result)

    async def test_scaffold_reuses_design_without_publishing(self):
        calls, result = await self.run_mode('scaffold')
        self.assertEqual(calls, ['scaffold'])
        self.assertEqual(result['services'][0]['name'], 'existing-api')
        self.assertTrue(result['scaffolded_files'])

    def test_archive_contains_actual_source_and_blueprint(self):
        data = build_scaffold_archive([{'path': 'api/main.py', 'content': 'print(1)'}], '# Tasks')
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            self.assertEqual(archive.read('api/main.py'), b'print(1)')
            self.assertEqual(archive.read('BLUEPRINT.md'), b'# Tasks')

    def test_archive_rejects_unsafe_and_duplicate_paths(self):
        for path in ['../escape.py', '/etc/passwd', 'C:\\test', '..\\escape.py']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                build_scaffold_archive([{'path': path, 'content': 'x'}])
        with self.assertRaises(ValueError):
            build_scaffold_archive([{'path': 'a', 'content': '1'}, {'path': 'a', 'content': '2'}])

    def test_modification_preserves_context(self):
        from agent import server
        captured = {}
        class FakePipeline:
            async def astream(self, state):
                captured.update(state)
                yield {'design_architecture': {'services': [{'name': 'tasks-api'}]}}
        with patch.object(server, 'compile_architecture_pipeline', return_value=FakePipeline()), patch.dict('os.environ', {'OPENROUTER_API': 'test'}):
            response = server.app.test_client().post('/api/v1/architect', json={
                'requirements': 'Use Redis for caching', 'modification': 'Use Redis for caching',
                'architecture': {'user_requirements': 'Build a task tracker', 'services': [{'name': 'tasks-api'}]},
            })
            self.assertEqual(response.status_code, 200)
            self.assertIn('"type": "complete"', response.data.decode())
        self.assertIn('Build a task tracker', captured['user_requirements'])
        self.assertIn('Use Redis for caching', captured['user_requirements'])
        self.assertIn('tasks-api', captured['user_requirements'])


if __name__ == '__main__':
    unittest.main()
