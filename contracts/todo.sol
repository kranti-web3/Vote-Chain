// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Todo {
    struct Task {
        uint256 id;
        string text;
        bool completed;
        address owner;
    }

    uint256 private nextTaskId;

    mapping(address => Task[]) private userTasks;

    event TaskCreated(
        address indexed owner,
        uint256 indexed taskId,
        string text
    );

    event TaskUpdated(
        address indexed owner,
        uint256 indexed taskId,
        string text
    );

    event TaskCompleted(
        address indexed owner,
        uint256 indexed taskId,
        bool completed
    );

    event TaskDeleted(
        address indexed owner,
        uint256 indexed taskId
    );

    function createTask(string calldata _text) external {
        require(bytes(_text).length > 0, "Task text is empty");

        userTasks[msg.sender].push(
            Task({
                id: nextTaskId,
                text: _text,
                completed: false,
                owner: msg.sender
            })
        );

        emit TaskCreated(msg.sender, nextTaskId, _text);
        nextTaskId++;
    }

    function getMyTasks() external view returns (Task[] memory) {
        return userTasks[msg.sender];
    }

    function getTask(uint256 _index) external view returns (Task memory) {
        require(
            _index < userTasks[msg.sender].length,
            "Task does not exist"
        );

        return userTasks[msg.sender][_index];
    }

    function updateTask(uint256 _index, string calldata _newText) external {
        require(
            _index < userTasks[msg.sender].length,
            "Task does not exist"
        );
        require(bytes(_newText).length > 0, "Task text is empty");

        userTasks[msg.sender][_index].text = _newText;

        emit TaskUpdated(
            msg.sender,
            userTasks[msg.sender][_index].id,
            _newText
        );
    }

    function toggleTask(uint256 _index) external {
        require(
            _index < userTasks[msg.sender].length,
            "Task does not exist"
        );

        userTasks[msg.sender][_index].completed =
            !userTasks[msg.sender][_index].completed;

        emit TaskCompleted(
            msg.sender,
            userTasks[msg.sender][_index].id,
            userTasks[msg.sender][_index].completed
        );
    }

    function deleteTask(uint256 _index) external {
        require(
            _index < userTasks[msg.sender].length,
            "Task does not exist"
        );

        uint256 taskId = userTasks[msg.sender][_index].id;
        uint256 lastIndex = userTasks[msg.sender].length - 1;

        if (_index != lastIndex) {
            userTasks[msg.sender][_index] = userTasks[msg.sender][lastIndex];
        }

        userTasks[msg.sender].pop();

        emit TaskDeleted(msg.sender, taskId);
    }

    function getMyTaskCount() external view returns (uint256) {
        return userTasks[msg.sender].length;
    }
}
